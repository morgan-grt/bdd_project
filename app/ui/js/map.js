let mongodbSize;
let sortCountry = 0;
let sortCity = 1;
let sortDate = 1;
let defaultCities = ["CAEN", "PARIS", "BARCELONA", "NURNBERG", "SEVILLA", "BORDEAUX", "HAMBURG", "MADRID", "SAARBRUCKEN", "NICE"];
let defaultCity = "CAEN";
let defaultCitiesText = '["CAEN", "PARIS", "BARCELONA", "NURNBERG", "SEVILLA", "BORDEAUX", "HAMBURG", "MADRID", "SAARBRUCKEN", "NICE"]';
let columns = ["country", "city", "date", "prcp", "snwd", "tavg", "tmax", "tmin", "latitude", "longitude"];

let hostname = "192.168.1.15"
let port = "4000"

function getMongodbSize()
{
    let query = `{CountItem}`;

    d3.json(`http://${hostname}:${port}/?query=${query}`)
            .then(updateMongodbSize);
}

function updateMongodbSize(root)
{
    mongodbSize = root.data.CountItem;
}

function getCitiesPosition()
{
	let query = `{Range (sortBy:["date", "city"], sortMethod: 1) {city latitude longitude}}`;

	return `http://${hostname}:${port}/?query=${query}`;
}

getMongodbSize();

function updateSortLimit(newLimit)
{
    sortLimit = newLimit;
}


function query()
{
    let sorting = "sortBy:[";
    let sortingMethod = "sortMethod:[";

    if (sortDate != 0)
    {
        sorting += '"date",';
        sortingMethod += sortDate + ",";
    }
    if (sortCountry != 0)
    {
        sorting += '"country",';
        sortingMethod += sortCountry + ",";
    }
    if (sortCity != 0)
    {
        sorting += '"city",';
        sortingMethod += sortCity + ",";
    }

    sorting += "]";
    sortingMethod += "]";

    let query = `{Multiple(${sorting},${sortingMethod},`
        + `city:${defaultCitiesText})`
        + `{date,country,city,prcp,snwd,tavg,tmax,tmin}}`;

    return `http://${hostname}:${port}/?query=${query}`;
}

function drawMap() 
{
	d3.json(getCitiesPosition())
		.then(function(positions)
		{

		const margin = {top: 50, right: 200, bottom: 30, left: 50},
        	width = 920 - margin.left - margin.right,
        	height = 800 - margin.top - margin.bottom;

		positions = positions.data.Range;

		let dataKeys = defaultCities.map(function(d){ return d.key })
	    let color = d3.scaleOrdinal(d3.schemeTableau10);
	    color.domain(dataKeys);

	    let legendTextX = 0,
	        legendTextY = 40,
	        legendX = width + margin.left + 40,
	        legendY = margin.top + 100;

	    let legendDiv = d3.select("#content")
            .append("div")
            .attr("id", "legend-div")
            .style("z-index", "1")
            .style("position", "absolute")
            .style("left", legendX + "px")
            .style("top", legendY + "px")
            .style("width", 200 + "px")
            .style("height", 60 * defaultCities.length + "px")

	    defaultCities.forEach(function (d, i) 
        {
                let legendSubDiv = legendDiv.append("div")
                    .attr("class", "legend-round")
                    .style("width", "250px")
                    .style("height", "24px")
                    .style("display", "inline-block")
                    .style("margin-bottom", "36px")
                    .on("click",  function(e) { drawCityGraph(e, d, color(d)); });

                let legendCircle = legendSubDiv.append("div")
                    .attr("class", "legend-circle")
                    .attr("id", "legend-input-" + d)
                    .style("background-color", function(){ return color(d) })
                    .style("width", "24px")
                    .style("height", "24px")
                    .style("border-radius", "50%")
                    .style("display", "inline-block")


                legendSubDiv.append("span")
                    .attr("class", "legend-text")
                    .style("height", "24px")
                    .style("position", "absolute")
                    .style("margin-left", "10px")
                    .text(d)
        });

		// The svg
		let svg = d3.select("#content")
		  	.append("svg")
		  	.attr("width", width + margin.left + margin.right)
        	.attr("height", height + margin.top + margin.bottom)
		  	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);

        x.domain([0, 10]);
        y.domain([0, 10]);

		// Add the X Axis
        let xAxisCreate = d3.axisBottom(x)
            .ticks(10)
            .tickSize(-height)
            .tickFormat(function(d) { return ""; });

        let xAxis = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxisCreate)

        // Add the Y Axis
        let yAxisCreate = d3.axisLeft(y)
            .ticks(10)
            .tickSize(-width)
            .tickFormat(function(d) { return ""; });

        let yAxis = svg.append("g")
            .attr("class", "y axis")
            .call(yAxisCreate)

		// Map and projection
		let projection = d3.geoMercator()
		    .center([4, 47])                // GPS of location to zoom on
		    .scale(1020)                       // This is like the zoom
		    .translate([ width/2, height/2 ])

		// Load external datas and boot
		d3.json("/geojson/european_countries.geojson")
			.then(function(data)
			{

			data.features = data.features.filter( function(d)
				{
				return d.properties.name=="Spain"
					|| d.properties.name=="Germany"
					|| d.properties.name=="France"
				});


		    // Draw the map
		    svg.append("g")
		    	.attr("id", "map-path")
		        .selectAll("path")
		        .data(data.features)
		        .enter()
		        .append("path")
		          	.attr("fill", "#b8b8b8")
		          	.attr("d", d3.geoPath()
		              	.projection(projection)
		          )
		        .style("stroke", "black")
		        .style("opacity", .3)

		    // create a tooltip
		    let Tooltip = d3.select("#content")
		      	.append("div")
		      	.attr("class", "tooltip")
		      	.style("position", "absolute")
		      	.style("opacity", 1)
		      	.style("background-color", "#D3D3D3")
		      	.style("opacity", "0.8")
		      	.style("background-color", "rgb(41, 45, 47)")
		      	.style("padding", "15px")
		      	.style("box-shadow", "rgb(0, 0, 0) 0px 5px 10px 0px")
		      	.style("transform", "translate(-9999px, 0)")

		    // Three function that change the tooltip when user hover / move / leave a cell
		    let mouseover = function(d) {
		      	Tooltip.style("opacity", 1)
		      		.style("transform", "translate(0, 0)");
		    }
		    let mousemove = function(e, d) {
		      	Tooltip.html(d.city + "<br>" + "long: " + d.longitude + "<br>" + "lat: " + d.latitude)
		        	.style("left", (d3.pointer(e)[0]+10) + "px")
		        	.style("top", (d3.pointer(e)[1]) + "px")
		    }
		    let mouseleave = function(d) {
		      	Tooltip.style("opacity", 0)
		      		.style("transform", "translate(-9999px, 0)")
		    }

		    // Add circles:
		    svg.append("g")
		    	.attr("id", "map-circles")
		    	.selectAll("map-circle")
		      	.data(positions)
		      	.enter()
		      	.append("circle")
	        	.attr("cx", function(d){ return projection([d.longitude, d.latitude])[0] })
	        	.attr("cy", function(d){ return projection([d.longitude, d.latitude])[1] })
	        	.attr("r", 14)
	        	.attr("class", "circle map-circle")
	        	.style("fill", "69b3a2")
	        	.style("stroke", function(d){ return color(d.city) })
	        	.attr("stroke-width", 3)
	        	.attr("fill-opacity", .4)
		      	.on("mouseover", mouseover)
		      	.on("mousemove", mousemove)
		      	.on("mouseleave", mouseleave)
		      	.on("click", function(e, d) { drawCityGraph(e, d.city, color(d.city)); })
		});
	});
}

// set the dimensions and margins of the city graph
const marginG = {top: 50, right: 200, bottom: 30, left: 50},
    widthG = 920 - marginG.left - marginG.right,
    heightG = 720 - marginG.top - marginG.bottom
    marginTopAdjustment = 800;

let legendXG = marginG.left + 40,
    legendYG = marginG.top + 36 + marginTopAdjustment;

drawMap();
