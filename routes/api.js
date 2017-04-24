+function () {
    'use strict';

    const mongoose = require('mongoose');
    const router = require('express').Router();
    const sensorSchema = require('../schemas/sensor');
    const request = require('request');
    const config = require('../config.json');

    const BLINDS_OPEN = "blinds_open";
    const BLINDS_CLOSED = "blinds_close";

    const HVAC_HEAT = "hvac_heat";
    const HVAC_COOL = "hvac_cool";
    const HVAC_OFF = "hvac_off";

    let currentData = {};
    let controllersState = {};

    const models = {
        'temperature': mongoose.model('Temperature', sensorSchema),
        'light': mongoose.model('Light', sensorSchema)
    };

    router.get('/sensors/:type', function (req, res, next) {
        let sensorType = req.params['type'];
        let model = models[sensorType];

        if (model) {
            model.find(function (err, data) {
                res.json(data);
            });
        } else {
            next();
        }
    });

    // listen for POST request on /api/sensors/light or /api/sensors/temperature
    //noinspection JSUnresolvedFunction
    router.post('/sensors/:type', function (req, res, next) {
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

                try {
                    handleData();
                } catch (e) {
                    console.log('error ', e);
                }
            });
        } else {
            next();
        }
    });

    function sendMirrorCommand(controller, command, params) {
        if (!controller || controllersState[controller] !== command) {
            let requestBody = {
                id: command,
                params: Array.isArray(params) ? params : []
            };

            console.log(requestBody);
            request.put({
                url: config.mirrorAddress,
                method: 'PUT',
                json: true,
                body: requestBody
            }, (error) => {
                if (error) {
                    console.log(error);
                } else if (controller) {
                    controllersState[controller] = command;
                }
            });
        }
    }

    function handleData() {
        let currentTemp = currentData['temperature'];
        let currentLight = currentData['light'];

        if(typeof currentTemp === "undefined" || typeof currentLight === "undefined") {
            return;
        }

        if (currentTemp >= config.lowerTempLimit && currentTemp <= config.upperTempLimit) {
            sendMirrorCommand('hvac', HVAC_OFF);

            if (currentLight <= config.brightResistance) {
                sendMirrorCommand('blinds', BLINDS_CLOSED);
                sendMirrorCommand('lights', 'lights_action', ['', 'off']);
            } else if (currentLight >= config.darkResistance) {
                sendMirrorCommand('blinds', BLINDS_OPEN);
                sendMirrorCommand('lights', 'lights_action', ['', 'on']);
            }
        } else {
            if (currentTemp < config.lowerTempLimit) {
                sendMirrorCommand('hvac', HVAC_HEAT);
                if (currentLight <= config.brightResistance) {
                    sendMirrorCommand('blinds', BLINDS_OPEN);
                }
            } else if (currentTemp > config.upperTempLimit) {
                sendMirrorCommand('hvac', HVAC_COOL);

                if (currentLight <= config.brightResistance) {
                    sendMirrorCommand('blinds', BLINDS_OPEN);
                }
            }
        }
    }

    module.exports = router;
}();