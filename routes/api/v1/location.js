import express from 'express';
var router = express.Router();
import LocationManager from "../../../managers/LocationManager.js";



//router for location interaction
/* hooked at /api/v1/locations */

router.get("/", getLocations);
router.get("/:locationId", getLocationById);

router.put("/create", createLocation);
router.post("/update/:id", updateLocation);
router.delete("/delete/:id", deleteLocation);


function getLocations(req, res, next) {
    //get all clients
    LocationManager.getAll()
        .then(function(clients){
            res.json(clients);
        })
        .catch(err => {
            next(err);
        })
}

function getLocationById(req, res, next) {
    LocationManager.getById()
        .then(function(client){
            res.json(client);
        })
        .catch(err => {
            next(err);
        })
}

function createLocation(req, res, next) {
    const locationData = req.body;
    LocationManager.create(locationData)
        .then(function(location){
            res.json(location);
        })
        .catch(err => {
            next(err);
        })
}

function updateLocation(req, res, next) {
    const locationData = req.body;
    const id = req.params.id;
    LocationManager.update(id, locationData)
        .then(function(location){
            res.json(location);
        })
        .catch(err => {
            next(err);
        })
}

function deleteLocation(req, res, next) {
    const id = req.params.id;
    LocationManager.remove(id)
        .then(function(location){
            res.json(location);
        })
        .catch(err => {
            next(err);
        })
}



export default router