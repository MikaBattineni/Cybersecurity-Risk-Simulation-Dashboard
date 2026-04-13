# Sentinel AI Dashboard: Global AI Cyberwarfare Simulation

## Project Overview
This project is an interactive, browser-based dashboard designed to visualize probabilistic AI-driven cyber threats. By leveraging D3.js, the simulation maps global threat trajectories, attack frequencies, and threat vector networks through dynamic, interactive visualizations. 

## Technical Stack
* Frontend: HTML, CSS, JavaScript
* Visualization Libraries: D3.js (v7), TopoJSON
* Data Processing/Generation: Python

## Repository Contents
* `index.html`: The main structural layout for the dashboard interface.
* `style.css`: Custom styling for a dark-themed, cyber-security UI layout.
* `script.js` & `main.js`: The core logic for rendering the geospatial map, animated attack arcs, brushing timeline, and force-directed graph.
* `generate_threat_data.py`: A Python script utilized to generate a robust synthetic dataset of AI threats (e.g., Prompt Injection, Model Poisoning, Voice Cloning Scams).
* `ai_threat_data.json` & `final_data.json`: The JSON datasets powering the visual simulation.

## Dashboard Features
1. Interactive Global Map: Geospatial projection mapping cyberattack origins and targets, featuring semantic zooming and animated attack trajectories.
2. Temporal Filtering: A time-series bar chart that allows users to brush, filter, and isolate global incidents across specific date ranges.
3. Force-Directed Network: A draggable, physics-based network graph visualizing the probabilistic relationships between specific threat vectors and targeted industry sectors (e.g., Finance, Healthcare, Defense).

## How to Run
1. Clone or download the repository to your local machine.
2. Open `index.html` directly in any modern web browser (such as Chrome or Firefox).
3. For optimal performance and to ensure JSON data loads correctly, it is recommended to run the project via a local web server (e.g., using VS Code Live Server or by running `python -m http.server` in your terminal).
