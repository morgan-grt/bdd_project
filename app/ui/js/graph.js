let mongodbSize;
let sortCountry = 0;
let sortCity = 1;
let sortDate = 1;
let sortLimit = 3*300;
let sortSkip = 0;
let sortSkipNumber = 10;

function getMongodbSize()
{
    let query = `{CountItem}`;

    d3.json(`http://localhost:4000/?query=${query}`)
            .then(updateMongodbSize);
}

function updateMongodbSize(root)
{
    mongodbSize = root.data.CountItem;
}

getMongodbSize();

function sortByCity() {updateSortValues(0)}
function sortByCountry() {updateSortValues(1)}
function sortByDate() {updateSortValues(2)}

function updateSortLimit(newLimit)
{
    sortLimit = newLimit;
    updateSortValues()
}

function updateSortValues(sortIndex = -1, button="")
{
    switch(sortIndex)
    {
        case 0:
            switch (sortCity){
                case 0:
                    sortCity = 1; 
                    break;
                case 1:
                    sortCity = -1; 
                    break;
                case -1:
                    sortCity = 0; 
                    break;
                default:
                    sortCity = 0;
                    break;
            }
            break;
        case 1:
            switch (sortCountry){
                case 0:
                    sortCountry = 1; 
                    break;
                case 1:
                    sortCountry = -1; 
                    break;
                case -1:
                    sortCountry = 0; 
                    break;
                default:
                    sortCountry = 0;
                    break;
            }
            break;
        case 2:
            switch (sortDate){
                case 0:
                    sortDate = 1; 
                    break;
                case 1:
                    sortDate = -1; 
                    break;
                case -1:
                    sortDate = 0; 
                    break;
                default:
                    sortDate = 0;
                    break;
            }
            break;
        default:
            break;
    }

    query();
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

    let query = `{Range(${sorting},${sortingMethod},`
        + `limit:${sortLimit},skip:${sortSkip}, city:"SEVILLA")`
        + `{date,country,city,prcp,snwd,tavg,tmax,tmin}}`;

    d3.json(`http://localhost:4000/?query=${query}`)
            .then(drawGraph);
}

function drawGraph(d) 
{
    columns = ["country", "city", "date", "prcp", "snwd", "tavg", "tmax", "tmin"];

    // set the dimensions and margins of the graph
    const margin = {top: 30, right: 50, bottom: 30, left: 50},
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

    function createTooltipCursor() 
    {
        // Création d'un groupe qui contiendra tout le tooltip plus le cercle de suivi
        let tooltipCursor = svg.append("g")
            .attr("id", "tooltip-cursor")
            .style("display", "none");
        
        // Le cercle extérieur bleu clair
        tooltipCursor.append("circle")
            .attr("stroke", "#3498db")
            .attr("fill", "none")
            .attr("r", 4);

        tooltipCursor.append("line")
            .attr("class", "x-hover-line hover-line")
            .attr("y1", height)
            .attr("y2", height);

        tooltipCursor.append("line")
            .attr("class", "y-hover-line hover-line")
            .attr("x1", width)
            .attr("x2", width);

        return tooltipCursor;
    } 

    function createTooltip() 
    {
        let tooltip = svg.append("g")
            .attr("id", "tooltip")
            .style("display", "none");

        tooltip.append("rect")
            .attr("class", "polyline")
            .attr("width", "120")
            .attr("height", "40")
            .style("fill", "#fafafa")
            .style("stroke","#3498db")
            .style("opacity","0.9")
            .style("stroke-width","1")
        
        // Cet élément contiendra tout notre texte
        let text = tooltip.append("text")
            .attr("id", "tooltip-text")
            .style("font-size", "13px")
            .style("color", "#333333")
            .style("fill", "#333333")
        
        // Element pour la date avec positionnement spécifique
        text.append("tspan")
            .attr("dx", "-5")
            .attr("id", "tooltip-date");
        
        // Positionnement spécifique pour le petit rond bleu
        text.append("tspan")
            .style("fill", "#3498db")
            .attr("dx", "-60")
            .attr("dy", "15")
            .text("●");
        
        // Le texte pour la valeur de l'or à la date sélectionnée
        text.append("tspan")
            .attr("id", "tooltip-tavg")
            .attr("dx", "10")
            .attr("dy", "0")
            .style("font-weight", "bold");
    
        return tooltip;
    }

    var data = d.data.Range;   

    // format the data
    data.forEach(function(d) {
        if (d.tavg == null || d.date == null){
            let index = data.indexOf(d);

            d.date = parseTime(d.date);
            d.tavg = +data[index].tavg;
        }
        else{
            d.date = parseTime(d.date);
            d.tavg = +d.tavg;
        }
    });    

    /*// Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([
        d3.min(data, 
        function(d) { return d.tavg; }) * 2.050, 
        d3.max(data, 
        function(d) { return d.tavg; }) * 1.050]);   */

    
    let axisPad = 6

    let x = d3.scaleTime()
          .domain(d3.extent(data, function(d) { return d.date; }))
          .range([0, width])

    let y = d3.scaleLinear()
      .domain([nearest(d3.min(data, d => d.tavg)), nearest(d3.max(data, d => d.tavg))])
      .range([height, 0]);

    let xAxis = d3.axisBottom(x)
        .ticks(10)
        .tickSize(-height)
    
    let yAxis = d3.axisLeft(y)
        .ticks(10)
        .tickSize(-width)
        .tickFormat(function(d) {return d + "°C";})

    function nearest(x) {
        if (x < 0) {
            return Math.floor(x / 2) * 2
        }
        else {
            return Math.round(x / 3) * 3
        }
    }

    const line = d3.line()
        .curve(d3.curveCardinal)   
        .x(d => x(d.date))
        .y(d => y(d.tavg)); 

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    let linePath = svg.append("path")
        .datum(data)
        .style("fill", "none")
        .style("stroke", "#3498db")
        .style("stroke-width", "2px")
        .style("opacity", "0.6")
        .attr("d", line);

    let tooltipCursor = createTooltipCursor();
    let tooltip = createTooltip();

    let bisectDate = d3.bisector(d => d.date).left;

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() { 
            tooltipCursor.style("display", null);
            tooltip.style("display", null);
            d3.select(".mouse-line")
                .style("opacity", "1");
        })
        .on("mouseout", function() {
            tooltipCursor.style("display", "none");
            tooltip.style("display", "none");
        })
        .on("mousemove", function(e){mousemove(e);});

    function mousemove(e) {
        pointer = d3.pointer(e);
        let x0 = x.invert(pointer[0]),
            i = bisectDate(data, x0),
            d0 = i > 0 ? data[i - 1] : data[i],
            d1 = data[i],
            d = x0 - d0.year > d1.year - x0 ? d1 : d0;

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

}

updateSortValues();

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