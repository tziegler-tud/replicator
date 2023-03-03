import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';

import { create } from 'express-handlebars';

import endpoints from './config/endpoints.json' assert { type: 'json' };
import hueConfig from './config/hueConfig.json' assert { type: 'json' };
import deconzConfig from './config/deconzConfig.json' assert { type: 'json' };

import {apiErrorHandler, webErrorHandler} from "./helpers/error-handler.js";
// var sassMiddleware = require('node-sass-middleware');

import IntentService from './services/IntentService.js';
import IntentHandlerService from "./services/IntentHandlerService.js";
import VoiceCommandService from "./services/voiceCommandService.js";
import CommunicationService from "./services/CommunicationService.js";
import ClientService from "./services/ClientService.js";
import LightsService from "./services/LightsService.js";
import IntegrationService from "./services/IntegrationService.js";
import SettingsService from "./services/SettingsService.js";

import apiIndexRouter from './routes/api/v1/index.js';
import clientRouter from './routes/api/v1/client.js';
import intentRouter from './routes/api/v1/intents.js';
import locationRouter from './routes/api/v1/location.js';
import lightRouter from './routes/api/v1/lights.js';

import webIndexRouter from './routes/web/index.js';



var app = express();

// index.js
 const __dirname = path.dirname(fileURLToPath(import.meta.url));
global.appRoot = path.resolve(__dirname);

// view engine setup
import handlebarsHelpers from "./helpers/handlebars/helpers.js"
const hbs = create({
    helpers: handlebarsHelpers,
})
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(sassMiddleware({
//   src: path.join(__dirname, 'public'),
//   dest: path.join(__dirname, 'public'),
//   indentedSyntax: true, // true = .sass and false = .scss
//   sourceMap: true
// }));

app.use(express.static(path.join(__dirname, 'src')));

app.use('/api', apiIndexRouter);
app.use('/api/v1/clients', clientRouter);
app.use('/api/v1/intents', intentRouter);
app.use('/api/v1/locations', locationRouter);
app.use('/api/v1/lights', lightRouter);
app.use("/api", apiErrorHandler);

app.use('/', webIndexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


//load settings from db
const settingsService = SettingsService.start({})

// IntentService.start();
const intentService = IntentService.start({config: "/rhinoModels/0_3_1/replicator_v0_3_1.yml"});

//init voice command service
const voiceCommandService =VoiceCommandService.start({});

//init clientService
let clientServiceEndpoints = endpoints.clients;
const clientService =ClientService.start({});

//init communication service
const communicationService =CommunicationService.start({});

//init lights service
const lightsService =LightsService.start({});

//load Integration Service
const integrationService = new Promise(function(resolve, reject){
    IntegrationService.start({})
        .then(init => {
            let BridgeUrl = hueConfig.bridgeUrl;
            let BridgeUser = hueConfig.bridgeUserToken;
            IntegrationService.loadIntegration(IntegrationService.integrations.HUE, {BridgeUrl: BridgeUrl, BridgeUser: BridgeUser})
                .then(()=> {
                    resolve();
                })
                .catch(err=> {
                    reject(err);
                })

            // let deconzUrl = deconzConfig.bridgeUrl;
            // let deconzUser = deconzConfig.bridgeUrl;
            // IntegrationService.loadIntegration(IntegrationService.integrations.DECONZ, {BridgeUrl: deconzUrl, BridgeUser: deconzUser})
            //     .then(()=> {
            //         resolve();
            //     })
            //     .catch(err=> {
            //         reject(err);
            //     })
        });
});

const intentHandlerService = IntentHandlerService.start();

/**
 * testing
 */

const servicesArray = [
    settingsService,
    intentService,
    voiceCommandService,
    clientService,
    communicationService,
    lightsService,
    integrationService,
    intentHandlerService,
]


// import createIntentHandler from "./test/intentHandlers.js";
// Promise.all(servicesArray).then(()=> {
//     createIntentHandler();
// });

export default app;
