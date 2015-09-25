#!/usr/local/bin/node

/*
This script will log wind direction and speed to a file
*/

var fs      = require('fs-extra');  // For file system stuffs
var request = require('request');   // For HTTP call stuffs
var moment  = require('moment');    // For dateformat stuffs
var dtd     = require('degtodir');  // Degrees to direction converter

// basic script settings
var RETRY_INTERVAL  =  60 * 1000;
var RETRY_AMOUNT    =  15;
var CITY            = "Amsterdam";
var COUNTRY_CODE    = "NL";

var retries = 0;
var apiError = false;

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
    var dir = __dirname + "/logs";
    var file = dir + "/wind.log";
    // ensure file exists using fs-extra
    fs.ensureFile(file, function (err) {
        if(!err){
            // no error, write the line to the file
            line += "\r\n";
            fs.appendFile(file, line, function (err) {
                if (err) {
                    return log(err);
                }
                log("Saving file: " + file);
            });
        } else {
            log(err);
        }        
    });    
}

// make a call to the api
function apiCall(callback) {
    // declare API stuffs
    // var apiKey = "44b456335f8c7ab81a09cc743bf5b332";
    var apiBaseUri = "http://api.openweathermap.org/data/2.5/weather";
    var apiUriOptions = "?q=" + CITY + "," + COUNTRY_CODE + "&units=metric";
    var apiUri = apiBaseUri + apiUriOptions;

    // set up for request
    var options = {
        url: apiUri,
    };

    // set up 'getData', this is part of 'Request'
    function getData(error, response, body) {
        // check for http errors
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            // check for api errors, city may not exist, etc.
            if (data.cod === 200) {
                // no api error, check if we got wind data
                if (!data.wind.deg) {
                    // wind.deg not found we should make another call to the api
                    process.nextTick(function () { // is nextTick even necessary?
                        callback();
                    });
                } else {
                    // wind.deg found
                    saveData(null, data);
                }
            } else {
                // api error!
                log(data.cod + ", " + data.message); // print to console
                appendLine(data.cod + ", " + data.message); // but also notify in log
            }        
        } else {
            // http error!
            log(error);
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
        log("Saving line: " + line);
        appendLine(line);
    } else {
        line += "Gave up after " + retries + " retries";
        appendLine(line);
    }
}

// run the program
pollApi();
