'use strict';

let mongoose = require('mongoose');

let temperatureSchema = mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true
    },
    temperature: {
        type: Number,
        required: true
    },
    time: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Temperature', temperatureSchema);

