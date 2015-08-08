#!/usr/local/bin/node

/*
This script will log wind direction and speed to a file
*/

var fs = require('fs');
var request = require('request');
var moment = require('moment');
var dtd = require('degtodir');

var RETRY_INTERVAL = 60 * 1000;
var RETRY_AMOUNT = 15;
var retries = 0;

// function to return formatted 'now' date
function dateFormat(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

// print log string to console
function log(string) {
    console.log(dateFormat(new Date()) + " " + string);
}

// function which prints the given argument to a file called wind.log
function appendLine(line) {
    // do not use a relative path!
    // the log will not be saved in the scripts dir when using a cron job!
    var file = "/home/pi/www/wind-log/logs/wind.log";
    line += "\r\n";
    fs.appendFile(file, line, function (err) {
        if (err) {
            return log(err);
        }
        log("File saved " + file);
    });
}

// make a call to the api
function apiCall(callback) {
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
            if (data.wind.deg == null) { // ('==' value is null or undefined)
                // wind.deg not found we should make another call to the api
                process.nextTick(function () { // is nextTick even necessary?
                    callback();
                });
            } else {
                // wind.deg found
                displayData(null, data);
                saveData(null, data);
            }
        } else {
            // error!
            displayData(error);
        }
    }

    // make request
    request(options, getData);
}

function retry() {
    // we did not get wind direction we should retry... And wait for a while
    retries += 1; // increment the amount of retries
    setTimeout(function () {
        log("did not get wind direction, retrying...");
        pollApi(); // poll the api again
    }, RETRY_INTERVAL); // wait for a while before retrying
}

// poll the api, if we did not get wind data, retry
function pollApi() {
    // if not getting wind data for RETRY_AMOUNT, give up
    if (retries < RETRY_AMOUNT) {
        apiCall(retry);
    } else {
        saveData('error');
    }
}

// display data on console
function displayData(error, data) {
    if (!error) {
        log(dtd.degToDir(data.wind.deg) + " " + data.wind.speed);
    } else {
        log(error);
    }
}

// create string with data, convert wind degrees to direction, notify of retries and print to file
function saveData(error, data) {
    var line = "";
    line += dateFormat(new Date());
    line += " ";
    if(!error){
        line += dtd.degToDir(data.wind.deg);
        line += " ";
        line += data.wind.speed;
        if (retries > 0) {
            line += " Needed " + retries + " retries";
        }
        log(line);
        appendLine(line);
    } else {
        line += "Gave up after " + retries + " retries";
        appendLine(line);
    }
}

// run the program
pollApi();
