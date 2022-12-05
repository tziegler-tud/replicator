import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';

// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');
// var sassMiddleware = require('node-sass-middleware');

import { Picovoice } from "@picovoice/picovoice-node";
import PvRecorder from "@picovoice/pvrecorder-node";

import IntentManager from './services/IntentManager.js';
import  VoiceCommandService from "./services/voiceCommandService.js";
import  ClientService from "./services/ClientService.js";
import  LightsService from "./services/LightsService.js";

import indexRouter from './routes/index.js';
import clientRouter from './routes/client.js';

var app = express();

// index.js
 const __dirname = path.dirname(fileURLToPath(import.meta.url));
global.appRoot = path.resolve(__dirname);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

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

app.use(express.static(path.join(__dirname, 'public')));

let clientService = new ClientService();



app.use('/', indexRouter);
app.use('/api/v1/client', clientRouter);
// app.use("/api", errorHandler.apiErrorHandler);

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

//init LightsService and connect to Hue Bridge
let BridgeUrl = "192.168.1.102";
let BridgeUser = "G2wTDFWTbQnqJ5VfaBfXC5G5fVcBMLim61FK0njf";
LightsService.BridgeUrl = BridgeUrl;
LightsService.BridgeUser = BridgeUser;
let lightsService = LightsService.createInstance(BridgeUrl, BridgeUser);

/*
intent manager setup
 */

let intentManager = new IntentManager();
intentManager.loadConfig("/rhinoModels/replicator_v0_3.yml");

//add handlers
import changeLightState from"./intentHandlers/changeLightState.js";
intentManager.getIntent("changeLightState").addHandlerArray(changeLightState);

import changeLightStateOff from"./intentHandlers/changeLightStateOff.js";
intentManager.getIntent("changeLightStateOff").addHandlerArray(changeLightStateOff);

import lightBrightnessGroup from"./intentHandlers/lightBrightnessGroup.js";
intentManager.getIntent("LightBrightnessGroup").addHandlerArray(lightBrightnessGroup);

import lightBrightnessLight from"./intentHandlers/lightBrightnessLight.js";
intentManager.getIntent("LightBrightnessLight").addHandlerArray(lightBrightnessLight);
//init voice command service
let voiceCommandService = new VoiceCommandService(intentManager);


export default app;
