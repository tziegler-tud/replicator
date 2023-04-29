import express from 'express';
var router = express.Router();

import clientService from "../../../services/ClientService.js";

import endpoints from '../../../config/endpoints.json' assert { type: 'json' };



//router for client interaction
/* hooked at /api/v1/clients */

router.get("/", getClients);

router.get("/:clientId/locations", getClientLocations);
router.post("/:clientId/locations", addClientLocation);
router.delete("/:clientId/locations", removeClientLocation);
router.get("/:clientId", getClientById);

router.post(endpoints.clients.register, registerClient);
router.post(endpoints.clients.connect, connectClient);
router.post(endpoints.clients.discover, discoverClient);




function getClients(req, res, next) {
    //get all clients
    clientService.getAllClients()
        .then(function(clients){
            res.json(clients);
        })
        .catch(err => {
            next(err);
        })
}

function getClientById(req, res, next) {
    const id = req.params.clientId;
    clientService.findOneById(id)
        .then(function(client){
            res.json(client);
        })
        .catch(err => {
            next(err);
        })
}

function registerClient(req, res, next) {
    let data = req.body;
    clientService.registerClient(data)
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            if(err.apiError) err = err.errorHandlerObject();
            next(err);
        })
}

function connectClient(req, res, next) {
    let data = req.body;
    clientService.connectClient(data)
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            if(err.apiError) err = err.errorHandlerObject();
            next(err);
        })
}

function discoverClient(req, res, next) {
    let data = req.body;
    clientService.discoverClient(data)
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            if(err.apiError) err = err.errorHandlerObject();
            next(err);
        })
}

function getClientLocations(req, res, next) {
    const id = req.params.clientId;
    clientService.getById(id)
        .then(function(client){
            res.json(client.locations);
        })
        .catch(err => {
            next(err);
        })
}

function addClientLocation(req, res, next) {
    const id = req.params.clientId;
    const locationId = req.body.id;
    clientService.getById(id)
        .then(function(client){
            client.addLocation(locationId)
            .then(result => {
                res.json(result);
            })
            .catch(err => {
                next(err);
            })
        })
        .catch(err => {
            next(err);
        })
}

function removeClientLocation(req, res, next) {
    const id = req.params.clientId;
    const locationId = req.body.id;
    let client = clientService.findOneById(id)
    if (client) {
        client.removeLocation(locationId)
            .then(result => {
                res.json(result);
            })
            .catch(err => {
                next(err);
            })
    }
    else next("Client not found.")
}

export default router