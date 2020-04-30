# d3maps
Ready-made maps for US

	mkdir temp && cd temp
	wget https://www2.census.gov/geo/tiger/GENZ2018/shp/cb_2018_us_county_20m.zip
	unzip cb_2018_us_county_20m.zip
	mapshaper cb_2018_us_county_20m.shp -filter 'parseInt(STATEFP) <= 56' -rename-layers counties -filter-fields STATEFP,GEOID,NAME,ALAND -rename-fields state_fips=STATEFP,fips=GEOID,name=NAME,area=ALAND -o format=topojson ../topojson/counties.topo.json
	cd ..
	rm -rf temp