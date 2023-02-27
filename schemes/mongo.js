import config from '../config/db.json' assert { type: 'json' };
import mongoose from 'mongoose';
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

import Client from "./clientScheme.js"
import Location from "./locationScheme.js"
import Light from "./lightScheme.js"
import LightGroup from "./lightGroupScheme.js"
import LightScene from "./lightSceneScheme.js"
import Settings from "./settingsScheme.js"
import Intent from "./intentScheme.js"
import IntentHandler from "./intentHandlerScheme.js"
let db = {
    Client: Client,
    Location: Location,
    Light: Light,
    LightGroup: LightGroup,
    LightScene: LightScene,
    Settings: Settings,
    Intent: Intent,
    IntentHandler: IntentHandler,
}
export default db;