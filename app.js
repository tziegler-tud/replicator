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
import settingsConfig from './config/config.json' assert { type: 'json' };

import {apiErrorHandler, webErrorHandler} from "./helpers/error-handler.js";

import IntentService from './services/IntentService.js';
import IntentHandlerService from "./services/IntentHandlerService.js";
import VoiceCommandService from "./services/voiceCommandService.js";
import CommunicationService from "./services/CommunicationService.js";
import ClientService from "./services/ClientService.js";
import LightsService from "./services/LightsService.js";
import IntegrationService from "./services/IntegrationService.js";
import SettingsService from "./services/SettingsService.js";
import AlertService from "./services/AlertService.js";
import SkillService from "./services/SkillService.js";
import SensorService from "./services/SensorService.js";
import TtsService from "./services/TtsService.js";
import AudioService from "./services/AudioService.js";

import apiIndexRouter from './routes/api/v1/index.js';
import clientRouter from './routes/api/v1/client.js';
import intentRouter from './routes/api/v1/intents.js';
import locationRouter from './routes/api/v1/location.js';
import lightRouter from './routes/api/v1/lights.js';
import intentHandlerRouter from './routes/api/v1/intentHandler.js';
import integrationsRouter from './routes/api/v1/integrations.js';
import alertsRouter from './routes/api/v1/alerts.js';

import webIndexRouter from './routes/web/index.js';
import webClientRouter from './routes/web/clients.js';
import webIntentRouter from './routes/web/intents.js';
import webIntentHandlerRouter from './routes/web/intentHandlers.js';
import webEntitiesRouter from './routes/web/entities.js';
import webIntegrationsRouter from './routes/web/integrations.js';
import webAlertsRouter from './routes/web/alerts.js';

import streamRouter from './routes/stream/stream.js';



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

app.use(express.static(path.join(__dirname, 'src')));

app.use('/api', apiIndexRouter);
app.use('/api/v1/clients', clientRouter);
app.use('/api/v1/intents', intentRouter);
app.use('/api/v1/locations', locationRouter);
app.use('/api/v1/lights', lightRouter);
app.use('/api/v1/intentHandler', intentHandlerRouter);
app.use('/api/v1/integrations', integrationsRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use("/api", apiErrorHandler);

app.use("/stream", streamRouter)

app.use('/', webIndexRouter);
app.use('/clients', webClientRouter);
app.use('/intents', webIntentRouter);
app.use('/intenthandlers', webIntentHandlerRouter);
app.use('/entities', webEntitiesRouter);
app.use('/integrations', webIntegrationsRouter);
app.use('/alerts', webAlertsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
app.use('/', webErrorHandler);


//load settings from db
const settingsService = SettingsService.start({})

// IntentService.start();
const intentService = IntentService.start({config: path.resolve(global.appRoot, settingsConfig.picovoice.rhino)});

//init voice command service
const voiceCommandService =VoiceCommandService.start({});

//init clientService
let clientServiceEndpoints = endpoints.clients;
const clientService =ClientService.start({});

//init communication service
const communicationService =CommunicationService.start({});

//init lights service
const lightsService =LightsService.start({});
const sensorService =SensorService.start({});


//load Integration Service
const integrationService = new Promise(function(resolve, reject){
    IntegrationService.start({})
        .then(init => {
            let BridgeUrl = hueConfig.bridgeUrl;
            let BridgeUser = hueConfig.bridgeUserToken;
            const HueIntegration = IntegrationService.loadIntegration(IntegrationService.integrations.HUE, {host: BridgeUrl, apiKey: BridgeUser});

            let deconzUrl = deconzConfig.host;
            let deconzPort = deconzConfig.port ?? 80;
            let deconzUser = deconzConfig.apiKey;
            const DeconzIntegration = IntegrationService.loadIntegration(IntegrationService.integrations.DECONZ, {host: deconzUrl, port: deconzPort, apiKey: deconzUser});
            resolve();
        })
        .catch(e => {
            console.log("Failed to start IntegrationService: " + e);
        })
});
const intentHandlerService = IntentHandlerService.start();
const alertService = AlertService.start({});
const skillService = SkillService.start({})

const ttsService = TtsService.start({})
const audioService = AudioService.start({})


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
    alertService,
    skillService,
    sensorService,
    ttsService,
    audioService
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
