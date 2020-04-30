import { select, selectAll, event } from 'd3-selection'; // Common convenience. Requires `npm install d3 --save`
import { geoPath, geoAlbersUsa } from 'd3-geo';
const topojson = require('topojson-client');
import elasticSVG from 'elastic-svg';

require("../d3map.scss");

const topologyStates = require("../topojson/states.topo.json");
const topologyCounties = require("../topojson/counties2.topo.json");
const fipsLookup = require("./fips.json");

console.log(topologyCounties)

const projection = geoAlbersUsa();
const path = geoPath().projection(projection);

let states = topojson.feature(topologyStates, topologyStates.objects.states).features;
let counties = topojson.feature(topologyCounties, topologyCounties.objects.counties).features;

counties.forEach(county => {
	county.properties.state = fipsLookup[county.properties.state_fips].name;
	county.properties.abbr = fipsLookup[county.properties.state_fips].abbr_two_letter;
});

let neighbors = topojson.neighbors(topologyCounties.objects.counties.geometries);

counties.forEach((county, c) => {
	county.neighbors = neighbors[c].map(i => counties[i]);
});


states = states.filter(d => d.properties.STUSPS != "PR");

const draw = function(selector, data, opts) {
	opts = opts || {};
	opts.key = opts.key || "abbr";

	let dataByKey = {};

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

	select(selector).append("div").attr("class", "d3map");
	selector += " .d3map";

	const base = elasticSVG(selector, {
		width: 960,
		aspect: 0.55,
		resize: "auto"
	});

	const svg = select(base.svg);

	const map = svg.append("g").attr("class", "countyMap");

	let g_counties = map.append("g").attr("class", "counties");
	let g_states = map.append("g").attr("class", "states");

	g_counties.selectAll(".county")
		.data(counties)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "county")
		.attr("id", function(d) {
			return "county_" + d.properties.fips
		}).on("click", function(d) {
			console.log(d);
			d.neighbors.forEach(n => {
				//g_counties.select("#county_" + n.properties.fips).style("fill", "yellow")
			});
		});

	g_states.selectAll(".state")
		.data(states)
		.enter()
		.append("path")
		.attr("class", "state")	
		.attr("d", path);

	return {
		g: g_counties,
		svg: svg,
		topology: topologyCounties,
		features: counties
	}

}

export { draw }