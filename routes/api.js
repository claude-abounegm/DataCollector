'use strict';

let express = require('express');
let router = express.Router();

let Temperature = require('../models/temperature');

router.get('/temp', function(req, res) {
    Temperature.find(function(err, temp) {
        res.json(temp);
    });
});

// listen for POST request on /api/temp
//noinspection JSUnresolvedFunction
router.post('/temp', function(req, res) {
    let data = {
        'id': req.body['id'],
        'key': req.body['key'],
        'temperature': +req.body['temperature'] || 0,
        'time': +req.body['time'] || 0
    };

    let success = false;
    Temperature.create(data, function (err) {
        if(err) {
            success = false;

            console.log('Error(s) in validation:');
            Object.keys(err.errors).forEach(function (key) {
                console.log('\t* ' + err.errors[key].message);
            });
        } else {
            success = true;
        }

        // log the data
        console.log('Data debug output: ');
        console.log({ data:  data, success: success });

        // send back the result
        res.json({ success: success });
    });
});

module.exports = router;