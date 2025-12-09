// --- CONFIGURATION ---
const mapContainer = document.getElementById('map-container');
const timelineContainer = document.getElementById('timeline-container');
const networkContainer = document.getElementById('network-container');
const tooltip = d3.select("#tooltip");

// --- 1. SETUP MAP SVG ---
const svgMap = d3.select("#map-container").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${mapContainer.clientWidth} ${mapContainer.clientHeight}`)
    .attr("preserveAspectRatio", "xMidYMid slice");

const mapGroup = svgMap.append("g");
const arcGroup = svgMap.append("g");

// Map Projection
const projection = d3.geoMercator()
    .center([0, 20])
    .scale(140)
    .translate([mapContainer.clientWidth / 2, mapContainer.clientHeight / 1.5]);

const path = d3.geoPath().projection(projection);

// --- 2. LOAD DATA ---
Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.json("ai_threat_data.json")
]).then(function(loadData) {
    
    const world = loadData[0];
    const threatData = loadData[1];

    console.log(`Loaded ${threatData.length} records.`);

    // --- A. DRAW MAP ---
    const attackCounts = {};
    threatData.forEach(d => {
        attackCounts[d.source_country] = (attackCounts[d.source_country] || 0) + 1;
    });

    const countryColor = d3.scaleSequential()
        .domain([0, 20])
        .interpolator(d3.interpolateRgb("#1c1e26", "#5a0000")); // Dark to Red

    mapGroup.selectAll("path")
        .data(world.features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "country")
        .attr("fill", d => {
            const count = attackCounts[d.properties.name] || 0;
            return count > 0 ? countryColor(count) : "#1c1e26";
        })
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            const count = attackCounts[d.properties.name] || 0;
            d3.select(this).attr("stroke", "#00d2ff").attr("stroke-width", 1.5);
            showTooltip(event, `<strong>${d.properties.name}</strong><br>Origin of ${count} attacks`);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "#333").attr("stroke-width", 0.5);
            hideTooltip();
        });

    // --- B. DRAW ARCS ---
    const arcs = arcGroup.selectAll(".attack-arc")
        .data(threatData)
        .enter().append("path")
        .attr("class", "attack-arc")
        .attr("stroke", d => d.severity > 8 ? "#ff0055" : "#00d2ff")
        .attr("stroke-width", d => d.severity > 8 ? 1.5 : 0.5)
        .attr("stroke-opacity", 0.6)
        .attr("d", d => {
            const source = projection(d.source_coords);
            const target = projection(d.target_coords);
            if(!source || !target) return null;
            
            const dx = target[0] - source[0],
                  dy = target[1] - source[1],
                  dr = Math.sqrt(dx * dx + dy * dy);
            return `M${source[0]},${source[1]}A${dr},${dr} 0 0,1 ${target[0]},${target[1]}`;
        })
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-opacity", 1).raise();
            showTooltip(event, `
                <strong>ATTACK DETECTED</strong><br>
                Type: ${d.type}<br>
                Target: ${d.target_country}<br>
                Sector: ${d.sector}
            `);
        })
        .on("mouseout", function(event, d) {
            d3.select(this).attr("stroke", d.severity > 8 ? "#ff0055" : "#00d2ff").attr("stroke-opacity", 0.6);
            hideTooltip();
        });

    // Animate Arcs
    arcs.each(function() {
        const totalLength = this.getTotalLength();
        d3.select(this)
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(Math.random() * 2000 + 2000) // Random duration 2-4s
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
    });

    // --- CALL OTHER VIZ ---
    drawTimeline(threatData);
    drawForceNetwork(threatData);

}).catch(err => console.error("Error loading data:", err));


// --- 3. FIXED TIMELINE (Bar Chart) ---
function drawTimeline(data) {
    d3.select("#timeline-container svg").remove();

    const width = timelineContainer.clientWidth;
    const height = timelineContainer.clientHeight - 40;
    const margin = {top: 20, right: 30, bottom: 40, left: 50};

    const svg = d3.select("#timeline-container").append("svg")
        .attr("width", width)
        .attr("height", height + 40);

    // FIX: Parse Month directly from date string "YYYY-MM-DD" -> "YYYY-MM"
    data.forEach(d => {
        d.computedMonth = d.date.substring(0, 7); 
    });

    // Group by this new computed month
    const attacksByMonth = d3.rollup(data, v => v.length, d => d.computedMonth);
    let timelineData = Array.from(attacksByMonth, ([key, value]) => ({ month: key, count: value }));
    
    // Sort
    timelineData.sort((a, b) => d3.ascending(a.month, b.month));

    const x = d3.scaleBand()
        .domain(timelineData.map(d => d.month))
        .range([margin.left, width - margin.right])
        .padding(0.4);

    const y = d3.scaleLinear()
        .domain([0, d3.max(timelineData, d => d.count) + 5]) // Add buffer
        .range([height - margin.bottom, margin.top]);

    // Draw Axes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d => d.substring(5))) // Show only MM
        .attr("color", "#888");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5))
        .attr("color", "#888");

    // Draw Bars
    svg.selectAll(".bar")
        .data(timelineData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.month))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => (height - margin.bottom) - y(d.count))
        .attr("fill", "#00d2ff")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "#ff0055");
            showTooltip(event, `<strong>${d.month}</strong><br>${d.count} Incidents`);
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "#00d2ff");
            hideTooltip();
        });
}


// --- 4. FORCE NETWORK ---
function drawForceNetwork(data) {
    d3.select("#network-container svg").remove();
    const width = networkContainer.clientWidth;
    const height = networkContainer.clientHeight - 40;

    const svg = d3.select("#network-container").append("svg")
        .attr("width", width)
        .attr("height", height);

    const threatTypes = [...new Set(data.map(d => d.type))];
    const sectors = [...new Set(data.map(d => d.sector))];
    
    let nodes = [];
    threatTypes.forEach(t => nodes.push({ id: t, group: "threat" }));
    sectors.forEach(s => nodes.push({ id: s, group: "sector" }));

    let links = [];
    data.forEach(d => {
        if (!links.some(l => l.source === d.type && l.target === d.sector)) {
            links.push({ source: d.type, target: d.sector });
        }
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).strength(0.1))
        .force("charge", d3.forceManyBody().strength(-200)) // Stronger repulsion
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(30));

    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", "#555");

    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", d => d.group === "threat" ? 8 : 14)
        .attr("fill", d => d.group === "threat" ? "#ff0055" : "#00d2ff") // Red vs Blue
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    const labels = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("class", "node-label")
        .attr("dx", 15)
        .attr("dy", ".35em")
        .style("fill", "#ccc")
        .style("font-size", "10px")
        .text(d => d.id);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    // Inputs
    d3.select("#chargeInput").on("input", function() {
        simulation.force("charge").strength(+this.value).alpha(1).restart();
    });
    d3.select("#collideInput").on("input", function() {
        simulation.force("collide").radius(+this.value).alpha(1).restart();
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// --- UTILS ---
function showTooltip(event, html) {
    tooltip.transition().duration(200).style("opacity", 1);
    tooltip.html(html)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
}
function hideTooltip() {
    tooltip.transition().duration(500).style("opacity", 0);
}