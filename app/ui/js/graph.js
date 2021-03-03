let mongodbSize;
let sortCountry = 0;
let sortCity = 1;
let sortDate = 1;
let sortLimit = 1*50*4;
let sortSkip = 0;
let sortSkipNumber = 10;
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
        + `limit:${sortLimit},skip:${sortSkip}, city:["${city}", "SEVILLA","PARIS", "NICE"])`
        + `{date,country,city,prcp,snwd,tavg,tmax,tmin}}`;

    d3.json(`http://${hostname}:${port}/?query=${query}`)
            .then(drawGraph);
}

function drawGraph(datas) 
{

    // set the dimensions and margins of the graph
    const margin = {top: 30, right: 100, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // parse the date / time
    const parseTime = d3.timeParse("%Y-%m-%d");
    const dateFormat = d3.timeFormat("%d-%b-%Y");

    var svg = d3.select("#content")
        .append("svg")
        .attr("id", "svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    console.log(datas)


    var color = d3.scaleOrdinal(d3.schemeDark2);

    var data = datas.data.Multiple;
    var dataNested = [];

    data.forEach(function (d) {
        if (!this[d.city]) 
        {
            this[d.city] = { key: d.city, values: [] };
            dataNested.push(this[d.city]);
        }
        this[d.city].values.push({ date: parseTime(d.date), tavg: d.tavg });
    }, Object.create(null));


    // format the data
    data.forEach(function(d) {
        d.date = parseTime(d.date);
        d.tavg = +d.tavg;
    });

    let res = data.map(function(d){ return d.key })
    color.domain(res);

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    x.domain(d3.extent(data, function(d) { return d.date; }))
    y.domain([
        d3.min(dataNested, function(c) {
            return d3.min(c.values, function(v) {
                return nearest(v.tavg);
            });
        }),
        d3.max(dataNested, function(c) {
            return d3.max(c.values, function(v) {
                return nearest(v.tavg);
            });
        })
    ]);
    

    function nearest(x) {
        if (x < 0) {
            return Math.floor(x / 2) * 2
        }
        else {
            return Math.ceil(x / 3) * 3
        }
    }

    const line = d3.line()
        .curve(d3.curveCardinal)   
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.tavg); }); 

    // Add the X Axis
    let xAxis = d3.axisBottom(x)
        .ticks(10)
        .tickSize(-height);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    let yAxis = d3.axisLeft(y)
        .ticks(10)
        .tickSize(-width)
        .tickFormat(function(d) { return d + "°C"; });

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);




    

    let glines = svg.selectAll('.line-group')
        .data(dataNested)
        .enter()
        .append("g")
        .attr("class", "line-group")

    glines.append('path')
        .attr('class', 'line')  
        .attr('d', function(d) { return line(d.values); })
        .style("stroke", function(d){ return color(d.key) })
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
    

    var mouseG = svg.append("g")
        .attr("class", "mouse-over-effects");

    mouseG.append("path") // this is the black vertical line to follow mouse
        .attr("class", "mouse-line")
        .style("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", "0");
      
    var lines = document.getElementsByClassName('line');

    var mousePerLine = mouseG.selectAll('.mouse-per-line')
        .data(dataNested)
        .enter()
        .append("g")
        .attr("class", "mouse-per-line");

    mousePerLine.append("circle")
        .attr("r", 4)
        .style("stroke", function(d) { return color(d.key); })
        .style("fill", "none")
        .style("stroke-width", "1px")
        .style("opacity", "0");

    mousePerLine.append("text")
        .attr("transform", "translate(10,3)");

    /*var tooltip = svg.append("g")
        .attr("id", "tooltip")
        .style("opacity", "0")
    */

    var tooltip = d3.select("#content").append("div")
        .attr('id', 'tooltip-div')
        .style('position', 'absolute')
        .style("background-color", "#D3D3D3")
        .style('padding', 6)
        .style('display', 'none')
        .style("width", "150px")
        .style("opacity", "0.7")
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
        console.log(i)
        console.log(color(d.key))
        text.append("p")
            .attr("id", "tooltip-tavg-" + d.key)
            .style("color", color(d.key))
            .style("margin", "0")
            .style("margin-left", "15px")
            .style("text-align", "left")
            //.attr("dx", "-75")
            //.attr("dy", 10 + 5 * i)
            .text("●");
    
        // Le texte pour la valeur de l'or à la date sélectionnée
        text.append("tspan")
            
            .attr("dx", "10")
            .attr("dy", 2 + 10 * i)
            .style("font-weight", "bold");
    }, Object.create(null));
    
    // Positionnement spécifique pour le petit rond bleu
    


    mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
        .attr('width', width) // can't catch mouse events on a g element
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', function() { // on mouse out hide line, circles and text
            d3.select(".mouse-line")
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line circle")
                .style("opacity", "0");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "0");
            d3.select("#tooltip-div")
                .style("display", "none");
        })
        .on('mouseover', function() { // on mouse in show line, circles and text
            d3.select(".mouse-line")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line circle")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "1");
            d3.select("#tooltip-div")
                .style("display", "block");
        })
        .on('mousemove', function(e) { // mouse moving over canvas
            var mouse = d3.pointer(e);
            d3.select(".mouse-line")
                .attr("d", function() {
                    var d = "M" + mouse[0] + "," + height;
                    d += " " + mouse[0] + "," + 0;
                    return d;
                });

            d3.selectAll(".mouse-per-line")
                .attr("transform", function(d, i) {
                    var xDate = x.invert(mouse[0]),
                    bisect = d3.bisector(function(d) { return d.date; }).right;
                    idx = bisect(dataNested.values, xDate);
            
                    var beginning = 0,
                    end = lines[i].getTotalLength(),
                    target = null;

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

                    closestElement = bisect(data, xDate, 1), 
                        d0 = data[closestElement - 1],
                        d1 = closestElement < data.length ? data[closestElement] : data[closestElement - 1],
                        dx = xDate - d0.date > d1.date - xDate ? d1 : d0;

                    d3.select('#tooltip-date')
                            .text(dateFormat(dx.date));


                    d3.select('#tooltip-tavg-' + d.key)
                        .text("● " + d.key + "  :  " + y.invert(pos.y).toFixed(2) + " °C");


                    let tootltipX = (mouse[0] > width - 170) 
                        ? mouse[0] - 170 
                        : mouse[0] + 2 * margin.left;

                    let tootltipY = mouse[1] + 2 * margin.top;

                    tooltip.style('display', 'block')
                        .style('left', tootltipX + "px")
                        .style('top', tootltipY + "px")

                  
                    return "translate(" + mouse[0] + "," + pos.y +")";
                })
        });


    /*
    function mousemove(e) {
        let pointer = d3.pointer(e);
        let x0 = x.invert(pointer[0]),
            closestElement = bisectDate(data, x0, 1), //<-- use the bisector to search the array for the closest point to the left and find that point given our mouse position
            d0 = data[closestElement - 1],
            d1 = data[closestElement],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        let polylineX = (pointer[0] > width - 200) ? pointer[0] - 200 : pointer[0] + margin.left;
        let tooltipText = (pointer[0] > width - 200) ? pointer[0] - 200 + 20 : pointer[0] + margin.left + 20;


        tooltip
            .select(".polyline")
            .attr("transform", "translate(" + polylineX + "," + pointer[1] + ")");
        tooltip
            .select("#tooltip-text")
            .attr("transform", "translate(" + tooltipText + "," + (pointer[1] + 15) + ")");
        
        tooltipCursor.attr("transform", "translate(" + x(d.date) + "," + y(d.tavg) + ")");

        
        
        tooltipCursor.select(".x-hover-line").attr("y1", -height + (height - y(d.tavg)));
        tooltipCursor.select(".x-hover-line").attr("y2", height -  y(d.tavg));

        d3.select('#tooltip-date')
            .text(dateFormat(d.date));
        d3.select('#tooltip-tavg')
            .text(d.tavg + "°C");
    }
    */

}

query();

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