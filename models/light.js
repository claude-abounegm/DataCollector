'use strict';

let mongoose = require('mongoose');

let numberValidate = [function (val) {
    return val > 0;
}, 'Path `{PATH}` needs to be greater than zero.'];

let lightSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true
    },
    light: {
        type: Number,
        required: true,
        validate: numberValidate
    },
    time: {
        type: Number,
        required: true,
        validate: numberValidate
    }
});

module.exports = mongoose.model('Light', lightSchema);

