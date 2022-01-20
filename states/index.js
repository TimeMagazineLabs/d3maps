import { select, selectAll, zoom, geoPath, geoAlbersUsa } from 'd3';
const topojson = require('topojson-client');
import elasticSVG from 'elastic-svg';

const WIDTH = 960;
const HEIGHT = 500;
const ASPECT = HEIGHT / WIDTH;

const topology = require("../topojson/states.topo.json");
const projection = geoAlbersUsa();

const path = geoPath().projection(projection);

let states = topojson.feature(topology, topology.objects.states).features;

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
		states.forEach(d => {
			d.data = dataByKey[d.properties.STUSPS] || dataByKey[d.properties.NAME];
		})
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

	const map = svg.append("g").attr("class", "stateMap");

	let insets = [ "NH", "VT", "MA", "CT", "RI", "NJ", "DE", "DC" ];

	var states_g = map.selectAll(".state")
		.data(states)
		.enter()
		.append("g")
		.attr("class", "state")
		.attr("id", function(d) {
			d.center = path.centroid(d);
			d.area = path.area(d);
			return "state_" + d.properties.STUSPS
		});

	states_g.append("path").attr("d", path);

	let side = 60;
	let x = 895;
	let y = 15;		
	let font_size = 27;

	insets.forEach((d, i) => {
		svg.select("#state_" + d)
			.append("rect")
			.attr("x", x)
			.attr("y", y + side * i)
			.attr("width", side)
			.attr("height", side)
			.attr("class", "inset");

		svg.select("#state_" + d)
			.append("text")
			.attr("x", x + side / 2)
			.attr("y", y + side * i + side / 2 + font_size - 18)
			.text(d)
			.style("font-size", font_size + "px")
			.style("text-anchor", "middle")
			.attr("class", "inset_text");	
	});

	return svg;

}

export { draw }