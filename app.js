'use strict';

let express = require('express');
let logger = require('morgan');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/data');
global.db = mongoose.connection;

// the actual app
let app = express();

// The logger shows each request sent to the server
app.use(logger('dev'));

// the bodyParser parses body sent by the client as JSON
// if the Content-Type is set to JSON.
app.use(bodyParser.json());

// decodes things like gzip and whatnot.
app.use(bodyParser.urlencoded({ extended: false }));

// Add /api/ route
app.use('/api/', require('./routes/api'));

// localhost:3000/
app.listen(3000, function () {
    console.log('Server has been started on port 3000.');
});