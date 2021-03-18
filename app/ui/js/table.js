let mongodbSize;
let sortCountry = 0;
let sortCity = 0;
let sortDate = 1;
let sortLimit = 10;
let sortSkip = 0;
let sortSkipNumber = 10;
let buttonTableCountry;
let defaultCities = ["CAEN", "PARIS", "BARCELONA", "NURNBERG", "SEVILLA", "BORDEAUX", "HAMBURG", "MADRID", "SAARBRUCKEN", "NICE"];

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

function sortByCity() {updateSortValues(0)}
function sortByCountry() {updateSortValues(1)}
function sortByDate() {updateSortValues(2)}

function getBeforeReset()
{
    sortSkip = 0;
    sortSkipNumber = sortLimit
    updateSortValues();
}

function getAfterReset()
{
    sortSkipNumber = sortLimit;
    sortSkip = mongodbSize - sortSkipNumber;
    updateSortValues();
}

function getBefore(newSkip = 10)
{
    sortSkipNumber = newSkip;
    if (sortSkip >= 0 + sortSkipNumber)
    {
        sortSkip -= sortSkipNumber;
    }
    updateSortValues();
}
function getAfter(newSkip = 10)
{
    sortSkipNumber = newSkip;
    if (sortSkip < mongodbSize - sortSkipNumber)
    {
        sortSkip += sortSkipNumber;
    }
    updateSortValues();
}

function updateSortLimit(newLimit)
{
    resetGraph();
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
        + `limit:${sortLimit},skip:${sortSkip})`
        + `{date,country,city,latitude,longitude,prcp,snwd,tavg,tmax,tmin}}`;

    d3.json(`http://${hostname}:${port}/?query=${query}`)
            .then(drawTable);
}

function createColumnClass(name)
{
    let sortValue = 0;
    switch (name)
    {
        case "city":
            sortValue = sortCity;
            break;
        case "country":
            sortValue = sortCountry;
            break;
        case "date":
            sortValue = sortDate;
            break;
        default:
            break;
    }

    switch (sortValue)
    {
        case 0:
            return "";
            break;
        case 1:
            return "ascendant";
            break;
        case -1:
            return "descendant";
            break;
        default:
            return "";
            break;
    }
}

function drawTable(root) 
{
    tableData = root.data.Range;
    columns = ["country", "city", "date", "latitude", "longitude", "prcp", "snwd", "tavg", "tmax", "tmin"];

    d3.select("#content").selectAll("*").remove();

    let table = d3.select("#content")
            .append("table")
            .attr("id", "div-table"),
        thead = table.append("thead"),
        tbody = table.append("tbody");

    // append the header row
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .attr("class", "th-adjustment")
        .append("button")
        .attr("class", function(column) 
            {
                if (column != "city" && column != "country" && column != "date") 
                    {return "btn btn-secondary btn-secondary-adjustment disabled";}
                else
                    {return "btn btn-secondary btn-secondary-adjustment " + createColumnClass(column);}
            })
        .attr("id", function(column) { return "btn-table-" + column; })
        .text(function(column) { return column; });

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(tableData)
        .enter()
        .append("tr");

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(row) {
            return columns.map(function(column) {
                return {column: column, value: row[column]};
            });
        })
        .enter()
        .append("td")
        .attr("class", function(row) {
            if (row.column == "city")
            {
                return "td-adjustment td-city";
            }
            else
            {
                return "td-adjustment";
            }
        })
        .on("click", function(e, row) {
            if (row.column == "city")
            {
                marginTopAdjustment = document.getElementById("content").offsetHeight 
                    + document.getElementById("manage-button").offsetHeight;
                legendYG = 65 + marginG.top + marginTopAdjustment;
                let dataKeys = defaultCities.map(function(d){ return d.key })
                let color = d3.scaleOrdinal(d3.schemeTableau10);
                color.domain(dataKeys);
                drawCityGraph(e, row.value, color(row.value));
            }
            else
            {
                return "td-adjustment";
            }
        })
        //.attr("style", "border: 1px solid black; padding: 2px 10px;")
        .html(function(d) { return d.value; });

}

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

// set the dimensions and margins of the city graph
const marginG = {top: 100, right: 200, bottom: 30, left: 50},
    widthG = 920 - marginG.left - marginG.right,
    heightG = 720 - marginG.top - marginG.bottom
    marginTopAdjustment = document.getElementById("content").offsetHeight;

let legendXG = marginG.left + 40,
    legendYG = 75 + marginG.top + marginTopAdjustment;

updateSortValues();