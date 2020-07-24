# d3maps
Ready-made maps for US

# Get Counties

	mkdir temp && cd temp
	wget https://www2.census.gov/geo/tiger/GENZ2018/shp/cb_2018_us_county_20m.zip
	unzip cb_2018_us_county_20m.zip
	mapshaper cb_2018_us_county_20m.shp -filter 'parseInt(STATEFP) <= 56' -rename-layers counties -filter-fields STATEFP,GEOID,NAME,ALAND -rename-fields state_fips=STATEFP,fips=GEOID,name=NAME,area=ALAND -o format=topojson ../topojson/counties.topo.json
	cd ..
	rm -rf temp

# Get World

	mkdir temp && cd temp
	wget https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_0_map_units.zip
	unzip ne_50m_admin_0_map_units.zip
	mapshaper ne_50m_admin_0_map_units.shp -rename-layers countries -filter-fields ADMIN,TYPE,ISO_A2,ISO_A3,ISO_N3,CONTINENT -rename-fields name=ADMIN,type=TYPE,iso2=ISO_A2,iso3=ISO_A3,iso_num=ISO_N3,cont=CONTINENT -o format=topojson ../topojson/world-50m.topo.json
	cd ..
	rm -rf temp

	mkdir temp && cd temp
	wget https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/cultural/ne_110m_admin_0_map_units.zip
	unzip ne_110m_admin_0_map_units.zip
	mapshaper ne_110m_admin_0_map_units.shp -rename-layers countries -filter-fields ADMIN,TYPE,ISO_A2,ISO_A3,ISO_N3,CONTINENT -rename-fields name=ADMIN,type=TYPE,iso2=ISO_A2,iso3=ISO_A3,iso_num=ISO_N3,cont=CONTINENT -o format=topojson ../topojson/world-110m.topo.json
	cd ..
	rm -rf temp
