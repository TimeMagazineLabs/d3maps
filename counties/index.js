import { select, selectAll, zoom, geoPath, geoAlbersUsa } from 'd3';
const topojson = require('topojson-client');
import elasticSVG from 'elastic-svg';

require("../d3map.scss");

let WIDTH = 960;
let HEIGHT = 500;
let ASPECT = HEIGHT / WIDTH;

const fipsLookup = require("./fips.json");
const topologyCounties = require("../topojson/counties_nyc.topo.json");
const projection = geoAlbersUsa();
const path = geoPath().projection(projection);

const draw = function(selector, data, opts) {
	data = data || null;
	opts = opts || {};
	opts.key = opts.key || "abbr";

	if (opts.hasOwnProperty("height")) {
		HEIGHT = opts.height;
		ASPECT = HEIGHT / WIDTH;
	}

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

	let dataByKey = {};

	if (data) {
		data.forEach(d => {
			let key = d[opts.key];
			dataByKey[key] = d;
		});

		if (Object.values(dataByKey).length == 0) {
			console.log("Invalid key for either state abbreviation or state name in data");
		} else {
			counties.forEach(d => {
				d.data = dataByKey[d.properties.fips];
			});
		}
	}

	select(selector).append("div").attr("class", "d3map");
	selector += " .d3map";

	const base = elasticSVG(selector, {
		width: WIDTH,
		aspect: ASPECT,
		resize: "auto"
	});

	const svg = select(base.svg);
	svg.append("defs");
	const map = svg.append("g").attr("class", "countyMap").attr("id", "countyMap");

	let g = {
		counties: map.append("g").attr("class", "counties").attr("id", "g_counties"),
		states: map.append("g").attr("class", "states").attr("id", "g_states"),
		extras: map.append("g").attr("class", "mapExtras").attr("id", "g_extras")
	};

	g.counties.selectAll(".county")
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
				g.counties.select("#county_" + n.properties.fips).style("fill", "yellow")
			});
			*/
		});

	g.states.selectAll(".state")
		.data(computedStates)
		.enter()
		.append("path")
		.attr("class", "state")	
		.attr("d", path);

	let countyZoom = zoom()
    	.scaleExtent([1, 12])
    	.translateExtent([ [0,0], [WIDTH, WIDTH * ASPECT ]])
    	.on('zoom', function(e) {
    		let k = e.transform.k;       	
        	g.counties.attr("transform", e.transform);
        	g.counties.selectAll(".county").style("stroke-width", 1 / k);

        	g.states.attr("transform", e.transform);
        	g.states.selectAll(".state").style("stroke-width", 2 / k);

        	g.extras.attr("transform", e.transform);
		});

    if (!opts.noZoom) {
		svg.call(countyZoom);
    }

	return {
		g: g,
		svg: svg,
		topology: topologyCounties,
		features: counties,
		projection: projection,
		width: WIDTH,
		height: HEIGHT,
		aspect: ASPECT
	}
}

export { draw }