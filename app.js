'use strict';

const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = require('express')();
const spawn = require('child_process').spawn;
const config = require('./config.json');

let sensorProcess;
function spawnSensorProcess(res) {
    let success = false;
    sensorProcess && sensorProcess.kill();

    sensorProcess = spawn('python', ['./sensor.py', config.readDelay], {detached: false});
    sensorProcess.on('exit', () => {
        if (!success) {
            console.error('Failed to run sensors script.');
            res && res.sendStatus(500);
        }
    });

    sensorProcess.stdout.on('data', function handleOutput(data) {
        if (data.toString().indexOf("Collecting Data") !== -1) {
            success = true;
            sensorProcess.stdout.removeListener('data', handleOutput);
            console.log('Sensors script successfully running.');
            res && res.sendStatus(200);
        }
    });
}

// The logger shows each request sent to the server
app.use(logger('dev'));

// the bodyParser parses body sent by the client as JSON
// if the Content-Type is set to JSON.
app.use(bodyParser.json());

// decodes things like gzip and whatnot.
app.use(bodyParser.urlencoded({extended: false}));

app.get('/control/:what?', (req, res) => {
    switch (req.params['what']) {
        case 'restartSensors':
            spawnSensorProcess(res);
            return;

        case undefined:
            res.json({list: ['restartSensors']});
            break;

        default:
            res.sendStatus(404);
    }
});

mongoose.connect('mongodb://127.0.0.1/data', (error) => {
    if (error) {
        console.error("Couldn't connect to database. Sending a 500 on all requests.");
        app.use(function (req, res) {
            res.status(500).json({'error': error});
        });
    } else {
        console.log('Successfully connected to database.');

        // Add /api/ route
        app.use('/api/', require('./routes/api'));

        // fallback to 404
        app.use(function (req, res) {
            res.sendStatus(404);
        });

        spawnSensorProcess();
    }
});

// localhost:3000/
app.listen(3000, () => {
    console.log('Server has been started on port 3000.');
});

process.on('SIGINT', () => {
    console.log('Cleaning up...');
    sensorProcess && sensorProcess.kill();
    process.exit();
});