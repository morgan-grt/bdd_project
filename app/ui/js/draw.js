function getCity(name)
{
	let query = `{Multiple (sortMethod:1, sortBy:["date"], city:"${name}") {country, city, date, prcp, snwd, tavg, tmax, tmin}}`;

	return `http://${hostname}:${port}/?query=${query}`;
}

function resetGraph()
{
	d3.select("#content-city").select("svg").remove();
    d3.select("#content-city").select("#value-div").remove();
    d3.select("#content-city").select("#button-div").remove();
    d3.select("#content-city").select("#legend-div").remove();
}

function drawCityGraph(event, name, color)
{
	defaultCity = name;
	console.log(marginTopAdjustment)

	d3.json(getCity(name))
		.then(function(datas)
		{
		    resetGraph();

		    // parse the date / time
		    const parseTime = d3.timeParse("%Y-%m-%d");
		    const dateFormat = d3.timeFormat("%d-%b-%Y");

		    let svg = d3.select("#content-city")
		        .append("svg")
		        .attr("id", "svg")
		        .attr("width", widthG + marginG.left + marginG.right)
		        .attr("height", heightG + marginG.top + marginG.bottom)
		        .append("g")
		        .attr("transform", "translate(" + marginG.left + "," + marginG.top + ")");

		    let differentDuration = 
		        {"2D": 2, "1W": 7, "2W": 14, "1M": 30, "3M": 90, "1Y": 365, "3Y": 365 * 3, "10Y": 365 * 10}

		    let intervalDayIndex = "1W";

		    let defaultValue = "tavg";

		    let dataKeys = defaultCities.map(function(d){ return d.key })

	        let legendDiv = d3.select("#content-city")
	            .append("div")
	            .attr("id", "legend-div")
	            .style("z-index", "1")
	            .style("position", "absolute")
	            .style("left", legendXG + "px")
	            .style("top", legendYG + "px")
	            .style("width", 200 + "px")
	            .style("height", "24px")

            let legendSubDiv = legendDiv.append("div")
                .attr("class", "legend-round")
                .style("width", "250px")
                .style("height", "24px")
                .style("display", "inline-block")

            let legendCircle = legendSubDiv.append("div")
                .attr("class", "legend-circle")
                .attr("id", "legend-input-" + defaultCity)
                .style("background-color", function(){ return color })
                .style("width", "24px")
                .style("height", "24px")
                .style("border-radius", "50%")
                .style("display", "inline-block")


            legendSubDiv.append("span")
                .attr("class", "legend-text")
                .style("height", "24px")
                .style("position", "absolute")
                .style("margin-left", "10px")
                .text(defaultCity)

            let valueDiv = d3.select("#content-city")
	            .append("div")
	            .attr("id", "value-div")
	            .style("position", "absolute")
	            .style("border-radius", "8px")
	            .style("padding", "3px")
	            .style("text-align", "center")
	            .style("width", 100 + "px")
	            .style("left", (widthG + marginG.left + 20) + "px")
	            .style("top", 200 + marginTopAdjustment + "px");

	        let valueSelect = valueDiv.append("div")
	        	.attr("class", "form-group")
	        	.append("select")
	        	.attr("id", "select-form")
	        	.attr("class", "custom-select custom-select-adjustment")
	        	
	        valueSelect.append("option")
	        	.attr("selected", "")
	        	.attr("value", "tavg")
	        	.text("tavg")

	        valueSelect.append("option")
	        	.attr("value", "tmin")
	        	.text("tmin")

	        valueSelect.append("option")
	        	.attr("value", "tmax")
	        	.text("tmax")

	        

	        let wantedCities = [defaultCity];

	        let data = datas.data.Multiple;

	        // format the data
	        data.forEach(function(d) {
	            d.date = parseTime(d.date);
	            d[defaultValue] = +d[defaultValue];
	        });


	        let filterData = function(value) 
	            {
	                cutoffDate = new Date(data[data.length - 1].date);
	                cutoffDate.setDate(cutoffDate.getDate() - value);
	                let result = data.filter(function(d) {
	                    //if (d.city == "PARIS") console.log(d)
	                    return d.date >= cutoffDate && wantedCities.includes(d.city)
	                })
	                return result;
	            }

	        let dataFiltered = filterData(differentDuration[intervalDayIndex]);

	        let groupData = function()
	            {
	                let result = [];
	                dataFiltered.forEach(function (d) {
	                    if (!this[d.city]) 
	                    {
	                        this[d.city] = { key: d.city, values: [] };
	                        result.push(this[d.city]);
	                    }
	                    this[d.city].values.push({ date: d.date, value: d[defaultValue] });
	                }, Object.create(null));
	                return result;
	            }

	        let dataNested = groupData();

	        const x = d3.scaleTime().range([0, widthG]);
	        const y = d3.scaleLinear().range([heightG, 0]);


	        let setDomains = function()
	            {
	                x.domain(d3.extent(dataFiltered, function(d) { return d.date; }));
	                y.domain([
	                    d3.min(dataNested, function(c) {
	                        return d3.min(c.values, function(v) {
	                            return nearest(v.value);
	                        });
	                    }),
	                    d3.max(dataNested, function(c) {
	                        return d3.max(c.values, function(v) {
	                            return nearest(v.value, true);
	                        });
	                    })
	                ]);
	            }

	        setDomains();
	        

	        function nearest(x, greater = false) 
	        {
	            if (greater) { return Math.ceil(x / 3) * 3 }
	            else {         return Math.floor(x / 3) * 3 }
	        }

	        const createLine = d3.line()
	            .curve(d3.curveCardinal)   
	            .x(function(d) { return x(d.date); })
	            .y(function(d) { return y(d.value); }); 

	        // Add the X Axis
	        let xAxisCreate = d3.axisBottom(x)
	            .ticks(10)
	            .tickSize(-heightG)

	        let xAxis = svg.append("g")
	            .attr("class", "x axis")
	            .attr("transform", "translate(0," + heightG + ")")
	            .call(xAxisCreate)

	        xAxis.selectAll("text")
	            .attr("y", 10);

	        // Add the Y Axis
	        let yAxisCreate = d3.axisLeft(y)
	            .ticks(10)
	            .tickSize(-widthG)
	            .tickFormat(function(d) { return d + "°C"; });

	        let yAxis = svg.append("g")
	            .attr("class", "y axis")
	            .call(yAxisCreate)
	            
	        yAxis.selectAll("text")
	            .attr("x", -10);


	        let buttonDiv = d3.select("#content-city")
	            .append("div")
	            .attr("id", "button-div")
	            .style("position", "absolute")
	            .style("background-color", "rgb(45, 46, 47)")
	            .style("border-radius", "8px")
	            .style("padding", "3px")
	            .style("text-align", "center")
	            .style("width", 340 + "px")
	            .style("left", (widthG + marginG.left - 340) + "px")
	            .style("top", legendYG - 6 + "px");

	        for (let key in differentDuration) {
	            buttonDiv.append("button")
	            .attr("class", "button-duration" + (key == intervalDayIndex ? " duration-active" : ""))
	            .attr("id", "button-duration-" + key)
	            .style("width", 40 + "px")
	            .style("height", 30 + "px")
	            .text(key)
	            .on("click", updateIntervalIndex)

	        }
	        

	        let drawedLines = svg.selectAll(".line").data(dataNested).attr("class","line");

	        drawedLines.enter().append("path")
	            .attr("class","line")
	            .style("stroke", function(d){ return color; })
	            .attr("fill", "none")
	            .attr("stroke-width", 1.5)
	            .attr("d", function(d) { return createLine(d.values); })
	        
	        let lines = document.getElementsByClassName('line');

	        let tooltip = createTooltip();
	        let tooltipLine = createTooltipLine();
	        
	        d3.select("#select-form").on("change", function(){ updateGraph(this.value); })

	        bisect = d3.bisector(function(d) { return d.date; }).right;

	        function updateIntervalIndex()
	        {
	            $(".button-duration").removeClass("duration-active");
	            intervalDayIndex = this.innerHTML;
	            $("#button-duration-"+intervalDayIndex).addClass("duration-active");

	            updateGraph();
	        }

	        function updateGraph(newValue = "")
	        {
	        	if (newValue != "")
	        		defaultValue = newValue
	        	console.log(defaultValue)
	            dataFiltered = filterData(differentDuration[intervalDayIndex]);
	            dataNested = groupData();
	            setDomains();

	            xAxis.transition()
	                .duration(1000)
	                .call(xAxisCreate)
	                .selectAll("text")
	                .attr("y", 10);

	            yAxis.transition()
	                .duration(1000)
	                .call(yAxisCreate)
	                .selectAll("text")
	                .attr("x", -10);

	            svg.selectAll(".line-group").remove();


	            drawedLines = svg.selectAll(".line").data(dataNested).attr("class","line")

	            drawedLines.transition()
	                .duration(1000)
	                .ease(d3.easeBack)
	                .attr("d", function(d) { return createLine(d.values); })
	                .style("stroke", function(d){ return color; })
	                .attr("stroke-width", 1.5);

	            drawedLines.enter()
	                .append("path")
	                .transition()
	                .duration(1000)
	                .ease(d3.easeBack)
	                .attr("class","line")
	                .attr("fill", "none")
	                .attr("stroke-width", 1.5)
	                .attr("d", function(d) { return createLine(d.values); })
	                .style("stroke", function(d){ return color; });

	            drawedLines.exit().remove();

	            tooltip = createTooltip();
	            tooltipLine = createTooltipLine();
	        }

	        function createTooltip()
	        {
	            d3.select("#content-city").selectAll("#tooltip-div").remove();

	            let tooltip = d3.select("#content-city").append("div")
	                .attr('id', 'tooltip-div')
	                .style('position', 'absolute')
	                .style("background-color", "#D3D3D3")
	                .style('padding', 6)
	                .style('display', 'none')
	                .style("width", "200px")
	                .style("opacity", "0.8")
	                .style("z-index", "1")
	                .style("box-shadow", "rgb(0, 0, 0) 0px 5px 10px 0px")
	                .style("color", "#fff")
	                .style("background-color", "rgb(41, 45, 47)")
	                .style("height", function(d) 
	                    { 
	                        return 20 * (Object.keys(dataNested).length + 1) + "px";
	                    })
	                
	            // Cet élément contiendra tout notre texte
	            let text = tooltip.append("text")
	                .attr("id", "tooltip-text")
	                .style("font-size", "13px")
	                //.style("color", "#333333")
	                .style("fill", "#333333");
	            
	            // Element pour la date avec positionnement spécifique
	            text.append("p")
	                .attr("dx", "20")
	                .style("margin", "0")
	                .style("text-align", "center")
	                .attr("id", "tooltip-date");

	            dataNested.forEach(function (d, i) {
	                text.append("p")
	                    .attr("id", "tooltip-value-" + d.key)
	                    .style("color", color)
	                    .style("margin", "0")
	                    .style("margin-left", "15px")
	                    .style("text-align", "left")

	                    .text("●");

	            }, Object.create(null));

	            return tooltip;
	        }

	        function createTooltipLine()
	        {
	            d3.select("#content-city").selectAll(".mouse-over-effects").remove();

	            let tooltipLine = svg.append("g")
	                .attr("class", "mouse-over-effects");

	            tooltipLine.append("path") // this is the black vertical line to follow mouse
	                .attr("class", "mouse-line")
	                .style("stroke", "rgb(26, 25, 24)")
	                .style("stroke-width", "1px")
	                .style("stroke-dasharray", "4px")
	                .style("opacity", "0");
	              

	            let tooltipLineCircle = tooltipLine.selectAll('.tooltip-line-circle')
	                .data(dataNested)
	                .enter()
	                .append("g")
	                .attr("class", "tooltip-line-circle");

	            tooltipLineCircle.append("circle")
	                .attr("r", 3)
	                .style("stroke", function(d) { return color; })
	                .style("fill", function(d) { return color; })
	                .style("stroke-width", "1px")
	                .style("opacity", "1")
	                .attr("visibility", "hidden");

	            tooltipLineCircle.append("circle")
	                .attr("r", 5)
	                .style("stroke", function(d) { return color; })
	                .style("fill", function(d) { return color; })
	                .style("stroke-width", "1px")
	                .style("opacity", "0.5")
	                .attr("visibility", "hidden");

	            tooltipLineCircle.append("text")
	                .attr("transform", "translate(10,3)");

	            tooltipLine.append("svg:rect") // append a rect to catch mouse movements on canvas
	                .attr("width", widthG) // can't catch mouse events on a g element
	                .attr("height", heightG)
	                .attr("fill", "none")
	                .style("position", "absolute")
	                .style("z-index", 2)
	                .attr("pointer-events", "all")
	                .on('mouseout', function() { // on mouse out hide line, circles and text
	                    d3.select(".mouse-line").style("opacity", "0");
	                    d3.selectAll(".tooltip-line-circle circle").attr("visibility", "hidden");
	                    d3.select("#tooltip-div").style("display", "none");
	                })
	                .on('mouseover', function() { // on mouse in show line, circles and text
	                    d3.select(".mouse-line").style("opacity", "1");
	                    d3.selectAll(".tooltip-line-circle circle").attr("visibility", "visible");
	                    d3.select("#tooltip-div").style("display", "block");
	                })
	                .on('mousemove', tooltipMouseMove);

	            return tooltipLine;
	        }

	        function tooltipMouseMove(e)
	        {
	            lines = document.getElementsByClassName('line');
	            tooltip = createTooltip();
	            let mouse = d3.pointer(e);

	            let xDate = x.invert(mouse[0])
	            closestElement = bisect(dataFiltered, xDate, 1), 
	            d0 = dataFiltered[closestElement - 1],
	            d1 = closestElement < dataFiltered.length ? dataFiltered[closestElement] : dataFiltered[closestElement - 1],
	            dx = xDate - d0.date > d1.date - xDate ? d1 : d0;

	            d3.select('#tooltip-date')
	                    .text(dateFormat(dx.date));

	            let tootltipX = (mouse[0] > widthG - 170) 
	                ? mouse[0] - 170 
	                : mouse[0] + 2 * marginG.left;

	            let tootltipY = mouse[1] + 2 * marginG.top + marginTopAdjustment;

	            tooltip.style('display', 'block')
	                .style('left', tootltipX + "px")
	                .style('top', tootltipY + "px");

	            d3.selectAll(".tooltip-line-circle")
	                .attr("transform", function(d, i) 
	                {
	                    let xDate = x.invert(mouse[0]);
	                    closestElement = bisect(d.values, xDate, 1)
	                    d0 = d.values[closestElement - 1]
	                    d1 = closestElement < d.values.length ? d.values[closestElement] : d.values[closestElement - 1]
	                    dx = xDate - d0.date > d1.date - xDate ? d1 : d0;
	                    
	                    let beginning = 0,
	                    end = lines[i].getTotalLength(),
	                    target = null,
	                    pos,
	                    xValue,
	                    yValue;


	                    if (differentDuration[intervalDayIndex] * wantedCities.length >= 200)
	                    {
	                        xValue = x(dx.date);
	                        yValue = y(dx.value);
	                    }
	                    else
	                    {
	                        while (true){
	                            target = Math.floor((beginning + end) / 2);
	                            pos = lines[i].getPointAtLength(target);
	                            if ((target === end || target === beginning) && pos.x !== mouse[0]) 
	                            {
	                                break;
	                            }
	                            if (pos.x > mouse[0])      end = target;
	                            else if (pos.x < mouse[0]) beginning = target;
	                            else break; //position found

	                        }

	                        xValue = pos.x;
	                        yValue = pos.y;
	                    }

	                    d3.select('#tooltip-value-' + d.key)
	                        .text("● " + d.key + "  :  " + y.invert(yValue).toFixed(2) + " °C");

	                    d3.select(".mouse-line")
	                    .attr("d", function() 
	                    {
	                        let d = "M" + xValue + "," + heightG;
	                        d += " " + xValue + "," + 0;
	                        return d;
	                    });
	                  
	                    return "translate(" + xValue + "," + yValue +")";
	                })
	        }
		});
}
