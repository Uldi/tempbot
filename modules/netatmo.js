var netatmo = require('netatmo');

module.exports = NetatmoHelper;

var station_names = [];
var devices_ids = [];
var station_data = [];

function NetatmoHelper() {
    if (!process.env.NETATMO_CLIENT_ID) {
        throw new Error('NETATMO_CLIENT_ID not defined as environment variable');
    }
    if (!process.env.NETATMO_CLIENT_SECRET) {
        throw new Error('NETATMO_CLIENT_SECRET not defined as environment variable');
    }
    if (!process.env.NETATMO_USERNAME) {
        throw new Error('NETATMO_USERNAME not defined as environment variable');
    }
    if (!process.env.NETATMO_PASSWORD) {
        throw new Error('NETATMO_PASSWORD not defined as environment variable');
    }

    var auth = {
        "client_id": process.env.NETATMO_CLIENT_ID,
        "client_secret": process.env.NETATMO_CLIENT_SECRET,
        "username": process.env.NETATMO_USERNAME,
        "password": process.env.NETATMO_PASSWORD,
    };

    var api = new netatmo(auth);
    return new Netatmo(api);
};

function Netatmo(api) {
    this.api = api;

    //initialize stations and devices
    //    this.station_names = [];
    //    this.devices_ids = [];
    api.getStationsData(function (err, devices) {
        console.log(devices);
        //retrieve station names
        for (i = 0; i < devices.length; i++) {
            console.log(devices[i].station_name);
            station_names[i] = devices[i].station_name;
            console.log(devices[i]._id);
            devices_ids[i] = devices[i]._id;
        }
        refreshStationsData();
    });

    function refreshStationsData() {
        console.log("refreshStationsData");
        api.getStationsData(function (err, devices) {
            console.log(devices);
            //retrieve station names
            for (i = 0; i < devices.length; i++) {
                station_data[i] = devices[i].dashboard_data;
                console.log(station_data[i]);
            }
        });
    }

    //refresh thread
    function refreshThread() {
        console.log("refreshThread called");
        refreshStationsData();
    }

    var refreshInt = 60000 //default
    if (process.env.NETATMO_REFRESH_INTERVAL) {
        refreshInt = parseInt(process.env.NETATMO_REFRESH_INTERVAL);

    }
    setInterval(refreshThread, refreshInt); //1 min
    console.log('Netatmo Refresh Thread started with interval of (ms) %s', refreshInt);


    this.getIndoorTemp = function getIndoorTemp(location) {
        console.log('getIndoorTemp for <' + location + '>');
        console.log("getStationNames %s", station_names);
        var idx = station_names.indexOf(location);
        console.log(idx);
        if (idx == -1) {
            throw new Error('No Weatherstation found with name ' + location);
        }

        return station_data[idx].Temperature;

    }

    this.getStationNames = function getStationNames() {
        console.log("getStationNames %s", station_names);
        return station_names;
    }

    /* this.getQnAResponsePromise = function getQnAResponsePromise(question) {
         if (!process.env.MICROSOFT_QNA_MAKER_URL) {
             throw new Error("MICROSOFT_QNA_MAKER_URL is not defined as env variable");
         }
         if (!process.env.MICROSOFT_QNA_MAKER_KEY) {
             throw new Error("MICROSOFT_QNA_MAKER_KEY is not defined as env variable. Please the Ocp-Apim-Subscription-Key from https://qnamaker.ai/Home/MyServices / View code");
         }
         var options = {
             method: 'POST',
             uri: process.env.MICROSOFT_QNA_MAKER_URL,
             headers: {
                 'Ocp-Apim-Subscription-Key': process.env.MICROSOFT_QNA_MAKER_KEY,
                 'Content-Type': 'application/json'
             },
             body: {
                 question: question
             },
             json: true // Automatically stringifies the body to JSON 
         };
         return rp(options);
     }

     this.getQnAResponse = function getQnAResponse(question, cb) {
         this.getQnAResponsePromise(question).then(value => {
             cb(question, value);
         });
     };*/
}