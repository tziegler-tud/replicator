const config = require('../config/db.json');
const mongoose = require('mongoose');

mongoose.set('debug', false);

var opt = {
    user: config.username,
    pass: config.pwd,
    auth: {
        authSource: config.authSource
    },
};

mongoose.connect(config.connectionString,opt);  // use this for remote database
mongoose.Promise = global.Promise;

module.exports = {
    Client: require('./clientScheme'),
};