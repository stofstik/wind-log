/*
This script will log wind direction and speed to a file
*/

var fs = require('fs');
var request = require('request');
var moment = require('moment');
var dtd = require('degtodir');

// function to return formatted 'now' date
function dateFormat(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

// print log string to console
function log(string) {
    console.log(dateFormat(new Date) + " " + string);
}

// function which prints the given argument to a file called wind.log
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

// make a call to the api
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

    // set up 'getData', this is part of 'Request'
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

// poll the api, if we did not get wind data we put apiCall on the event queue
function pollApi() {
    apiCall(function () {
        // we did not get wind direction we should retry... And wait for a while
        setTimeout(function () {
            log("did not get wind direction, retrying...");
            pollApi(); // call wrapper function to place apiCall() on the event queue again
        }, 1000 * 60); // wait for 1 minute
    });
}

// display data on console
function displayData(error, data) {
    if (!error) {
        log(dtd.degToDir(data.wind.deg) + " " + data.wind.speed);
    } else {
        log(error);
    }
}

// create string with data, convert wind degrees to direction and print to file
function saveData(data) {
    var line = "";
    line += dateFormat(new Date());
    line += " ";
    line += dtd.degToDir(data.wind.deg);
    line += " ";
    line += data.wind.speed;
    log(line);
    appendLine(line);
}

// run the program
pollApi();