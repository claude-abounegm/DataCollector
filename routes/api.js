'use strict';

let express = require('express');
let router = express.Router();

// listen for POST request on /api/temp
//noinspection JSUnresolvedFunction
router.post('/temp', function(req, res, next) {
    let data = {
        'id': req.body['id'],
        'key': req.body['key'],
        'temperature': +req.body['temperature'] || 0,
        'time': +req.body['time'] || 0
    };

    let message;
    let success = false;
    if(!data.id) {
        message = 'Missing id parameter.';
    } else if(!data.key) {
        message = 'Missing key parameter.';
    } else if(data.temperature <= 0) {
        message = 'Invalid temperature parameter.';
    } else if(data.time <= 0) {
        message = 'Invalid time parameter.';
    } else {
        message = "Sensor values updated successfully.";
        success = true;
    }

    // take a look at the parsed data
    let result = { 'success': success, 'message': message };

    // log the data
    console.log({ 'data':  data, 'result': result });

    // send back the result
    res.send(result);
    res.end();
});

module.exports = router;