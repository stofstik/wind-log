/*
This script will log wind direction and speed to a file
*/

var fs = require('fs');
var request = require('request');
var moment = require('moment');

// log("started!");

function dateFormat(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

function log (string){
    console.log(dateFormat(new Date) + " " +  string);
}

function appendLine(line) {
    var file = "wind.log";
    line += "\r\n";
    fs.appendFile(file, line, function (err) {
        if (err) {
            return log(err);
        }
        log("File saved");
    });
}

function degreesToDirection(deg) {
    if (deg >= 337.5 && deg <= 22.5) {
        return "N";
    } else if (deg >= 22.5 && deg <= 67.5) {
        return "NE";
    } else if (deg >= 67.5 && deg <= 112.5) {
        return "E";
    } else if (deg >= 112.5 && deg <= 157.5) {
        return "SE";
    } else if (deg >= 157.5 && deg <= 202.5) {
        return "S";
    } else if (deg >= 202.5 && deg <= 247.5) {
        return "SW";
    } else if (deg >= 247.5 && deg <= 292.5) {
        return "W";
    } else if (deg >= 292.5 && deg <= 337.5) {
        return "NW";
    }
}

function apiCall(retry) {
    // declare API stuffs
    // var apiKey = "44b456335f8c7ab81a09cc743bf5b332";
    var apiBaseUri = "http://api.openweathermap.org/data/2.5/weather";
    var apiUriOptions = "?q=Amsterdam&units=metric";
    var apiUri = apiBaseUri + apiUriOptions;

    // set up for request
    var options = {
        url: apiUri,
    };

    function getData(error, response, body) {
        if (!error && response.statusCode == 200) {
            // log(apiUri);
            var data = JSON.parse(body);
            if (!data.wind.deg) {
                // wind.deg not found we should make another call to the api
                process.nextTick(function () {
                    retry();
                });
            } else {
                // wind.deg found
                displayData(null, data);
                saveData(data);
            }
        } else {
            // error!
            displayData(error);
        }
    }

    // make request
    request(options, getData);
}

function displayData(error, data) {
    if (!error) {
        log(degreesToDirection(data.wind.deg) + " " + data.wind.speed);
    } else {
        log(error);
    }
}

function saveData(data) {
    var line = "";
    line += dateFormat(new Date());
    line += " ";
    line += degreesToDirection(data.wind.deg);
    line += " ";
    line += data.wind.speed;
    log(line);
    appendLine(line);
}


apiCall(function () {
    // we did not get data we should retry... With an interval
    setTimeout(function () {
        log("did not get data, retrying...");
        pollApi();
    }, 10000);
});

