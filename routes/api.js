'use strict';

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const request = require('request');
const sensorSchema = require('../schemas/sensor');

const models = {
    'temperature': mongoose.model('Temperature', sensorSchema),
    'light': mongoose.model('Light', sensorSchema)
};

router.get('/sensors/:type', function(req, res) {
    let sensorType = req.params['type'];
    let model = models[sensorType];
    if(model) {
        model.find(function(err, data) {
            res.json(data);
        });
    } else {
        res.json({ 'error': 'Cannot find sensor of type: ' + sensorType });
    }
});

// listen for POST request on /api/sensors/light or /api/sensors/temperature
//noinspection JSUnresolvedFunction
router.post('/sensors/:type', function(req, res) {
    let sensorType = req.params['type'];
    let model = models[sensorType];
    if(!model) {
        res.json({ success: false });
    } else {
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
            }

            // log the data
            console.log({data: data, success: success});

            // send back the result
            res.json({success: success});
        });
    }
});

router.post('/config', function(req, res) {

});

module.exports = router;