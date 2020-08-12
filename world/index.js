import { select, selectAll, event } from 'd3-selection'; // Common convenience. Requires `npm install d3 --save`
import { geoPath } from 'd3-geo';
import { geoRobinson } from 'd3-geo-projection';
import { zoom } from 'd3-zoom';
const topojson = require('topojson-client');
import elasticSVG from 'elastic-svg';

require("../d3map.scss");

const WIDTH = 960;
const HEIGHT = 500;
const ASPECT = HEIGHT / WIDTH;

const topology = require("../topojson/world-110m.topo.json");
const projection = geoRobinson();

let k = projection.scale();
projection.scale(k * 1.1);

projection.clipExtent([[0, 0], [WIDTH, HEIGHT - 10]]);
projection.translate([460, 300]);

const path = geoPath().projection(projection);
let countries = topojson.feature(topology, topology.objects.countries).features;

const draw = function(selector, data, opts) {
	opts = opts || {};
	opts.key = opts.key || "iso3";

	let dataByKey = {};

	data.forEach(d => {
		let key = d[opts.key];
		dataByKey[key] = d;
	});

	if (Object.values(dataByKey).length == 0) {
		console.log("Invalid key for either world abbreviation or name in data");
	} else {
		countries.forEach(d => {
			if (dataByKey[d.properties[opts.key]]) {
				d.data = dataByKey[d.properties[opts.key]];
			} else {
				//console.log("No data found for", d.properties.name, d.properties.iso2, d.properties.iso3)
			}
		})
	}

	select(selector).append("div").attr("class", "d3map");
	selector += " .d3map";

	const base = elasticSVG(selector, {
		width: WIDTH,
		aspect: ASPECT,
		// aspect: 0.55,
		resize: "auto"
	});

	const svg = select(base.svg);

	svg.append("defs");

	const map = svg.append("g").attr("class", "worldMap");

	var countries_g = map.selectAll(".country")
		.data(countries)
		.join("g")
		.attr("class", "country")
		.attr("id", function(d) {
			d.center = path.centroid(d);
			d.area = path.area(d);
			return "country_" + d.properties.iso3;
		});

	countries_g.append("path").attr("d", path);

	let scale = 1;

	let worldZoom = zoom()
    	.scaleExtent([1, 12])
    	.translateExtent([ [0,0], [WIDTH, WIDTH * ASPECT ]])
    	.on('zoom', function(d) {
    		let k = event.transform.k;
    		scale = k; 	
        	countries_g.attr("transform", event.transform);
        	countries_g.style("stroke-width", 1 / k);
		});

    svg.call(worldZoom);
	return svg;
}

export { draw }