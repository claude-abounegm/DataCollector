'use strict';

const mongoose = require('mongoose');
const router = require('express').Router();
const sensorSchema = require('../schemas/sensor');
const request = require('request');
const config = require('../config.json');

let blindsOpen = false;
let currentData = {
    'temperature': 70,
    'light': 100
};

const models = {
    'temperature': mongoose.model('Temperature', sensorSchema),
    'light': mongoose.model('Light', sensorSchema)
};

router.get('/sensors/:type', function(req, res, next) {
    let sensorType = req.params['type'];
    let model = models[sensorType];

    if(model) {
        model.find(function(err, data) {
            res.json(data);
        });
    } else {
        next();
    }
});

// listen for POST request on /api/sensors/light or /api/sensors/temperature
//noinspection JSUnresolvedFunction
router.post('/sensors/:type', function(req, res, next) {
    let sensorType = req.params['type'];
    let model = models[sensorType];

    if (model) {
        let data = {
            'id': req.body['id'],
            'key': req.body['key'],
            'value': +req.body['value'] || 0,
            'time': +req.body['time'] || 0
        };

        model.create(data, function (err) {
            let success = false;
            if (err) {
                success = false;

                console.log('Error(s) in validation:');
                Object.keys(err.errors).forEach(function (key) {
                    console.log('\t* ' + err.errors[key].message);
                });
            } else {
                success = true;
                currentData[sensorType] = data.value;
            }

            // log the data
            console.log({data: data, success: success});

            // send back the result
            res.json({success: success});

            handleData();
        });
    } else {
        next();
    }
});

function handleData() {
    let currentTemp = currentData['temperature'];
    let currentLight = currentData['light'];

    if(currentTemp >= config.lowerTempLimit && currentTemp <= config.upperTempLimit) {
        request.put(config.mirrorAddress, { command: "up" });
        request.put(config.mirrorAddress, { command: "hvacOff" });
    } else if(currentTemp < config.lowerTempLimit && !blindsOpen && currentLight >= config.brightLight) {
        blindsOpen = true;
        request.put(config.mirrorAddress, { command: "up" });
    } else if (currentTemp < config.lowerTempLimit && !blindsOpen && currentLight <= config.darkLight) {
        request.put(config.mirrorAddress, { command: "heat" });
    } else if (currentTemp > config.upperTempLimit && blindsOpen && currentLight >= config.brightLight) {
        blindsOpen = false;
        request.put(config.mirrorAddress, { command: "down" });
    } else if(currentTemp < config.lowerTempLimit && blindsOpen) {
        request.put(config.mirrorAddress, { command: "heat" });
    }
}

module.exports = router;