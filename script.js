// GLOBAL VARIABLES FOR INTERACTION
let globalData = [];
let mapSelection = null; // Store map selection to update it later

async function drawDashboard() {
    
    // 1. LOAD DATA
    const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
    globalData = await d3.json("final_data.json");
    const countries = topojson.feature(world, world.objects.countries);

    // --- 2. VIZ 1: THE MAP (ZOOMABLE) ---
    const mapContainer = document.getElementById("map-container");
    const width = mapContainer.clientWidth;
    const height = mapContainer.clientHeight;

    const svgMap = d3.select("#map-container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background", "#0f172a"); // Dark Ocean Color

    // Group for map elements to support zooming
    const gMap = svgMap.append("g");

    const projection = d3.geoMercator()
        .scale(140)
        .translate([width / 2, height / 1.5]);
    const path = d3.geoPath().projection(projection);

    // Draw Countries
    gMap.selectAll("path")
        .data(countries.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "#1e293b")
        .attr("stroke", "#334155")
        .attr("stroke-width", 0.5);

    // Draw Incidents
    const dots = gMap.selectAll("circle")
        .data(globalData)
        .enter().append("circle")
        .attr("class", "incident-dot")
        .attr("cx", d => projection([d.lng, d.lat])[0])
        .attr("cy", d => projection([d.lng, d.lat])[1])
        .attr("r", d => d.severity / 1.5) 
        .attr("fill", d => d.color)
        .attr("opacity", 0.8)
        .attr("stroke", "#000");

    // ** FEATURE: ZOOM (Shneiderman: Zoom) **
    const zoom = d3.zoom()
        .scaleExtent([1, 8]) // Min zoom 1x, Max 8x
        .on("zoom", (event) => {
            gMap.attr("transform", event.transform);
            // Semantic Zoom: Keep dots consistent size while zooming
            gMap.selectAll("circle").attr("r", d => (d.severity / 1.5) / event.transform.k); 
        });

    svgMap.call(zoom);

    // --- 3. VIZ 2: TIMELINE (FILTERABLE) ---
    const trendContainer = document.getElementById("trend-container");
    const tWidth = trendContainer.clientWidth;
    const tHeight = trendContainer.clientHeight;
    const margin = {top: 20, right: 20, bottom: 30, left: 40};

    const svgTrend = d3.select("#trend-container").append("svg")
        .attr("width", tWidth)
        .attr("height", tHeight);

    // Parse years and setup scales
    const x = d3.scaleLinear()
        .domain(d3.extent(globalData, d => d.year))
        .range([margin.left, tWidth - margin.right]);

    // Simple histogram binning for the timeline
    const histogram = d3.bin()
        .value(d => d.year)
        .domain(x.domain())
        .thresholds(x.ticks(5)); // 2020, 2021, etc.
    
    const bins = histogram(globalData);
    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([tHeight - margin.bottom, margin.top]);

    // Draw Timeline Bars
    const bars = svgTrend.selectAll("rect")
        .data(bins)
        .enter().append("rect")
        .attr("x", d => x(d.x0) + 1)
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("y", d => y(d.length))
        .attr("height", d => y(0) - y(d.length))
        .attr("fill", "#00e5ff")
        .attr("opacity", 0.6);

    // Add Axes
    svgTrend.append("g")
        .attr("transform", `translate(0,${tHeight - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(5))
        .style("color", "#889");

    // ** FEATURE: BRUSHING (Shneiderman: Filter) **
    const brush = d3.brushX()
        .extent([[margin.left, margin.top], [tWidth - margin.right, tHeight - margin.bottom]])
        .on("end", updateChart);

    svgTrend.append("g").call(brush);

    // Filter Logic
    function updateChart(event) {
        if (!event.selection) {
            dots.attr("opacity", 0.8); // Reset if no selection
            return;
        }
        const [x0, x1] = event.selection.map(x.invert);
        
        // Filter Dots on Map based on Year Range
        dots.attr("opacity", d => (d.year >= x0 && d.year <= x1) ? 1 : 0.1);
    }

    // --- 4. DETAILS ON DEMAND (INTERACTION) ---
    const tooltip = d3.select("#tooltip");
    
    dots.on("mouseover", function(event, d) {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
        tooltip.style("display", "block")
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY + 15) + "px")
            .html(`
                <h3>${d.title}</h3>
                <p><strong>Type:</strong> <span style="color:${d.color}">${d.category}</span></p>
                <p><strong>Year:</strong> ${d.year}</p>
                <p><strong>Severity:</strong> ${d.severity}/10</p>
                <p><em>${d.desc}</em></p>
            `);
    }).on("mouseout", function() {
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 1);
        tooltip.style("display", "none");
    });

    // Render Static Donut (Same as before, simplified for this step)
    renderDonut(globalData);
}

function renderDonut(data) {
    // ... (Keep the simple donut code or re-add it here if you need it)
    // For brevity, assuming you have the donut code. 
    // If you need me to re-paste the full donut function, let me know!
}

drawDashboard();