import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from "body-parser";
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
import intentHandlerRouter from './routes/api/v1/intentHandler.js';
import integrationsRouter from './routes/api/v1/integrations.js';

import webIndexRouter from './routes/web/index.js';
import webClientRouter from './routes/web/clients.js';
import webIntentRouter from './routes/web/intents.js';
import webIntentHandlerRouter from './routes/web/intentHandlers.js';
import webEntitiesRouter from './routes/web/entities.js';
import webIntegrationsRouter from './routes/web/integrations.js';



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

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json())
app.use(bodyParser.text());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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
app.use('/api/v1/intentHandler', intentHandlerRouter);
app.use('/api/v1/integrations', integrationsRouter);
app.use("/api", apiErrorHandler);

app.use('/', webIndexRouter);
app.use('/clients', webClientRouter);
app.use('/intents', webIntentRouter);
app.use('/intenthandlers', webIntentHandlerRouter);
app.use('/entities', webEntitiesRouter);
app.use('/integrations', webIntegrationsRouter);

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
            const HueIntegration = IntegrationService.loadIntegration(IntegrationService.integrations.HUE, {BridgeUrl: BridgeUrl, BridgeUser: BridgeUser});

            // let deconzUrl = deconzConfig.bridgeUrl;
            // let deconzUser = deconzConfig.bridgeUrl;
            // IntegrationService.loadIntegration(IntegrationService.integrations.DECONZ, {BridgeUrl: deconzUrl, BridgeUser: deconzUser})
            //     .then(()=> {
            //         resolve();
            //     })
            //     .catch(err=> {
            //         reject(err);
            //     })
            resolve();
        })
        .catch(e => {
            console.log("Failed to start IntegrationService: " + e);
        })
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

// import createDummyHandlers from "./test/createDummyHandlers.js";
// Promise.all(servicesArray).then(()=> {
//     createDummyHandlers(25);
// });

export default app;
