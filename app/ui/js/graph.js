let mongodbSize;
let sortCountry = 0;
let sortCity = 1;
let sortDate = 1;
let defaultCity = "CAEN"
let columns = ["country", "city", "date", "prcp", "snwd", "tavg", "tmax", "tmin"];

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

getMongodbSize();

function updateSortLimit(newLimit)
{
    sortLimit = newLimit;
}


function query(city = defaultCity)
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
        + `city:["${city}", "SEVILLA"])`
        + `{date,country,city,prcp,snwd,tavg,tmax,tmin}}`;

    return `http://${hostname}:${port}/?query=${query}`;
}

function drawGraph() 
{

    // set the dimensions and margins of the graph
    const margin = {top: 50, right: 200, bottom: 30, left: 50},
        width = 1280 - margin.left - margin.right,
        height = 720 - margin.top - margin.bottom;

    d3.select("#content").select("svg").remove();

    // parse the date / time
    const parseTime = d3.timeParse("%Y-%m-%d");
    const dateFormat = d3.timeFormat("%d-%b-%Y");

    let svg = d3.select("#content")
        .append("svg")
        .attr("id", "svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let differentDuration = 
        {"2D": 2, "1W": 7, "2W": 14, "1M": 30, "3M": 90, "1Y": 365, "3Y": 365 * 3, "ALL": 10^4}

    let color = d3.scaleOrdinal(d3.schemeSet2);
    let intervalDayIndex = "1W";

    d3.json(query())
            .then(function(datas) {

        let data = datas.data.Multiple;

        // format the data
        data.forEach(function(d) {
            d.date = parseTime(d.date);
            d.tavg = +d.tavg;
        });


        let filterData = function(value) 
            {
                cutoffDate = new Date(data[data.length - 1].date);
                cutoffDate.setDate(cutoffDate.getDate() - value);
                let result = data.filter(function(d) {
                    return d.date >= cutoffDate
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
                    this[d.city].values.push({ date: d.date, tavg: d.tavg });
                }, Object.create(null));
                return result;
            }

        let dataNested = groupData();



        let dataKeys = dataNested.map(function(d){ return d.key })
        color.domain(dataKeys);

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);


        let setDomains = function()
            {
                x.domain(d3.extent(dataFiltered, function(d) { return d.date; }));
                y.domain([
                    d3.min(dataNested, function(c) {
                        return d3.min(c.values, function(v) {
                            return nearest(v.tavg);
                        });
                    }),
                    d3.max(dataNested, function(c) {
                        return d3.max(c.values, function(v) {
                            return nearest(v.tavg, true);
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

        const line = d3.line()
            .curve(d3.curveCardinal)   
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.tavg); }); 

        // Add the X Axis
        let xAxisCreate = d3.axisBottom(x)
            .ticks(10)
            .tickSize(-height)

        let xAxis = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxisCreate)

        xAxis.selectAll("text")
            .attr("y", 10);

        // Add the Y Axis
        let yAxisCreate = d3.axisLeft(y)
            .ticks(10)
            .tickSize(-width)
            .tickFormat(function(d) { return d + "°C"; });

        let yAxis = svg.append("g")
            .attr("class", "y axis")
            .call(yAxisCreate)
            
        yAxis.selectAll("text")
            .attr("x", -10);


        // CREATE LEGEND //
        let legendTextX = 0
        let legendTextY = 40
        let legendX = width + 40
        let legendY = margin.top

        let svgLegend = svg.append('g')
            .attr('class', 'gLegend')
            .attr("transform", "translate(" + legendX + "," + legendY + ")")


        let legend = svgLegend.selectAll('.legend')
            .data(dataNested)
            .enter().append('g')
            .attr("class", "legend")
            .attr("transform", function (d, i) 
            {   
                return "translate(" +  i * legendTextX + "," + i * legendTextY + ")"
            })

        legend.append("circle")
            .attr("class", "legend-node")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 6)
            .style("fill", d=>color(d.key))

        legend.append("text")
            .attr("class", "legend-text")
            .attr("x", 6 * 2)
            .attr("y", 6)
            .style("fill", "#A9A9A9")
            .style("font-size", 12)
            .text(d=>d.key)

        let buttonDiv = d3.select("#content")
            .append("div")
            .style("position", "absolute")
            .style("background-color", "rgb(45, 46, 47)")
            .style("border-radius", "8px")
            .style("padding", "3px")
            .style("text-align", "center")
            .style("width", 340 + "px")
            .style("left", (width + margin.left - 340) + "px")
            .style("top", 80 + "px");

        for (let key in differentDuration) {
            buttonDiv.append("button")
            .attr("class", "button-duration" + (key == intervalDayIndex ? " duration-active" : ""))
            .attr("id", "button-duration-" + key)
            .style("width", 40 + "px")
            .style("height", 30 + "px")
            .text(key)
            .on("click", updateGraph)

        }
        

        let dataLines = svg.selectAll('.line-group')
            .data(dataNested)
            .enter()
            .append("g")
            .attr("class", "line-group")

        dataLines.append('path')
            .attr('class', 'line')  
            .attr('d', function(d) { return line(d.values); })
            .style("stroke", function(d){ return color(d.key) })
            .attr("fill", "none")
            .attr("stroke-width", 1.5)
        

        let tooltipLine = svg.append("g")
            .attr("class", "mouse-over-effects");

        tooltipLine.append("path") // this is the black vertical line to follow mouse
            .attr("class", "mouse-line")
            .style("stroke", "rgb(26, 25, 24)")
            .style("stroke-width", "1px")
            .style("stroke-dasharray", "4px")
            .style("opacity", "0");
          
        let lines = document.getElementsByClassName('line');

        let tooltipLineCircle = tooltipLine.selectAll('.tooltip-line-circle')
            .data(dataNested)
            .enter()
            .append("g")
            .attr("class", "tooltip-line-circle");

        tooltipLineCircle.append("circle")
            .attr("r", 3)
            .style("stroke", function(d) { return color(d.key); })
            .style("fill", function(d) { return color(d.key); })
            .style("stroke-width", "1px")
            .style("opacity", "1")
            .attr("visibility", "hidden");

        tooltipLineCircle.append("circle")
            .attr("r", 5)
            .style("stroke", function(d) { return color(d.key); })
            .style("fill", function(d) { return color(d.key); })
            .style("stroke-width", "1px")
            .style("opacity", "0.5")
            .attr("visibility", "hidden");

        tooltipLineCircle.append("text")
            .attr("transform", "translate(10,3)");

        

        let tooltip = d3.select("#content").append("div")
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
                .attr("id", "tooltip-tavg-" + d.key)
                .style("color", color(d.key))
                .style("margin", "0")
                .style("margin-left", "15px")
                .style("text-align", "left")

                .text("●");

        }, Object.create(null));
        
        // Positionnement spécifique pour le petit rond bleu
        
        bisect = d3.bisector(function(d) { return d.date; }).right;

        tooltipLine.append("svg:rect") // append a rect to catch mouse movements on canvas
            .attr("width", width) // can't catch mouse events on a g element
            .attr("height", height)
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
            .on('mousemove', function(e) { // mouse moving over canvas
                let mouse = d3.pointer(e);

                let xDate = x.invert(mouse[0])
                closestElement = bisect(dataFiltered, xDate, 1), 
                d0 = dataFiltered[closestElement - 1],
                d1 = closestElement < dataFiltered.length ? dataFiltered[closestElement] : dataFiltered[closestElement - 1],
                dx = xDate - d0.date > d1.date - xDate ? d1 : d0;

                d3.select('#tooltip-date')
                        .text(dateFormat(dx.date));

                let tootltipX = (mouse[0] > width - 170) 
                    ? mouse[0] - 170 
                    : mouse[0] + 2 * margin.left;

                let tootltipY = mouse[1] + 2 * margin.top;

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


                        if (differentDuration[intervalDayIndex] * dataKeys.length >= 200)
                        {
                            xValue = x(dx.date);
                            yValue = y(dx.tavg);
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

                        d3.select('#tooltip-tavg-' + d.key)
                            .text("● " + d.key + "  :  " + y.invert(yValue).toFixed(2) + " °C");

                        d3.select(".mouse-line")
                        .attr("d", function() 
                        {
                            let d = "M" + xValue + "," + height;
                            d += " " + xValue + "," + 0;
                            return d;
                        });
                      
                        return "translate(" + xValue + "," + yValue +")";
                    })
            });
        function updateGraph()
        {
            $(".button-duration").removeClass("duration-active");
            intervalDayIndex = this.innerHTML;
            $("#button-duration-"+intervalDayIndex).addClass("duration-active");

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

            dataLines.select('.line')
                .data(dataNested)
                .transition()
                .duration(1000)
                .ease(d3.easeBack)
                .attr('d', function(d) { return line(d.values); })

            tooltipLine.selectAll('.tooltip-line-circle')
                .data(dataNested)

        }
    });
}

drawGraph();

/*
@@ LISTENERS @@

Définition des listeners pour capter les évènements d'interraction
*/

/*
évènements de click sur un bouton pour trier
*/
$('#content').on('click', '#btn-table-country', function(){
        buttonTableCountry = this;
        updateSortValues(1, this);
});
$('#content').on('click', '#btn-table-city', function(){
        buttonTableCountry = this;
        updateSortValues(0, this);
});
$('#content').on('click', '#btn-table-date', function(){
        buttonTableCountry = this;
        updateSortValues(2, this);
});