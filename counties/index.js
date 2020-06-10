import { select, selectAll, event } from 'd3-selection'; // Common convenience. Requires `npm install d3 --save`
import { geoPath, geoAlbersUsa } from 'd3-geo';
import { zoom } from 'd3-zoom';
const topojson = require('topojson-client');
import elasticSVG from 'elastic-svg';

let topologyCounties = require("../topojson/counties_nyc.topo.json");
let fipsLookup = require("./fips.json");

const projection = geoAlbersUsa();
const path = geoPath().projection(projection);

const draw = function(selector, data, opts) {
	opts = opts || {};
	opts.key = opts.key || "abbr";

	let dataByKey = {};

	data.forEach(d => {
		let key = d[opts.key];
		dataByKey[key] = d;
	});

	let counties = topojson.feature(topologyCounties, topologyCounties.objects.counties).features;

	let computedStateFIPS = {};
	counties.forEach(function(county) { computedStateFIPS[+county.properties.fips - +county.properties.fips % 1000] = 1; });

	let computedStates = [];
	// and merge by fips
	Object.keys(computedStateFIPS).forEach(function(fip) {
	    let state = topojson.merge(topologyCounties, topologyCounties.objects.counties.geometries.filter(function(d) { return +d.properties.fips - +d.properties.fips % 1000 == fip; }));
	    computedStates.push(state);
	});

	if (opts.preflight) {
		topologyCounties = opts.preflight(topologyCounties, counties);
	}

	counties.forEach(county => {
		county.properties.state = fipsLookup[county.properties.state_fips].name;
		county.properties.abbr = fipsLookup[county.properties.state_fips].abbr_two_letter;
	});

	let neighbors = topojson.neighbors(topologyCounties.objects.counties.geometries);

	counties.forEach((county, c) => {
		county.neighbors = neighbors[c].map(i => counties[i]);
	});

	if (Object.values(dataByKey).length == 0) {
		console.log("Invalid key for either state abbreviation or state name in data");
	} else {
		counties.forEach(d => {
			d.data = dataByKey[d.properties.fips];
		});
	}

	select(selector).append("div").attr("class", "d3map");
	selector += " .d3map";

	const WIDTH = 960;
	const ASPECT = 0.55;

	const base = elasticSVG(selector, {
		width: WIDTH,
		aspect: ASPECT,
		resize: "auto"
	});

	const svg = select(base.svg);

	const map = svg.append("g").attr("class", "countyMap");

	let g_counties = map.append("g").attr("class", "counties");
	let g_states = map.append("g").attr("class", "states");
	let g_extras = map.append("g").attr("class", "mapExtras");

	g_counties.selectAll(".county")
		.data(counties)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "county")
		.attr("id", function(d) {
			d.centroid = path.centroid(d);
			return "county_" + d.properties.fips
		}).on("click", function(d) {
			if (opts.DEBUG) {
				console.log(d);
			}
			if (opts.onClick) {
				opts.onClick(d);
			}
			/*
			d.neighbors.forEach(n => {
				g_counties.select("#county_" + n.properties.fips).style("fill", "yellow")
			});
			*/
		});

	g_states.selectAll(".state")
		.data(computedStates)
		.enter()
		.append("path")
		.attr("class", "state")	
		.attr("d", path);

	let countyZoom = zoom()
    	.scaleExtent([1, 12])
    	.translateExtent([ [0,0], [WIDTH, WIDTH * ASPECT ]])
    	.on('zoom', function(d) {
    		let k = event.transform.k;       	
        	g_counties.attr("transform", event.transform);
        	g_counties.selectAll(".county").style("stroke-width", 1 / k);

        	g_states.attr("transform", event.transform);
        	g_states.selectAll(".state").style("stroke-width", 2 / k);

        	g_extras.attr("transform", event.transform);
		});

    svg.call(countyZoom);

	return {
		g: g_counties,
		svg: svg,
		topology: topologyCounties,
		features: counties
	}
}

export { draw }