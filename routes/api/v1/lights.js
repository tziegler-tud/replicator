import express from 'express';
var router = express.Router();

import LightsService from "../../../services/LightsService.js";

import endpoints from '../../../config/endpoints.json' assert { type: 'json' };



//router for client interaction
/* hooked at /api/v1/lights */

router.get("/lights", getLights);
router.get("/lights/:lightId", getLightById);
router.put("/lights/:lightId", setLightState)

router.get("/groups", getGroups);
router.get("/groups/:groupId", getGroupById);
router.put("/groups/:groupId", setGroupState);

router.get("/scenes", getScenes);
router.get("/scenes/:groupId", getSceneById);
router.put("/scenes/:groupId", setSceneState);


function getLights(req, res, next) {
    //get all clients
    LightsService.getLights()
        .then(lights => {
            res.json(lights)
        })
        .catch(err => {
            next(err);
        })

}

function getLightById(req, res, next) {
    LightsService.getLightById(req.params.lightId)
        .then(light => {
            if(light){
                res.json(light);
            }
            else {
                //return not found
                next();
            }
        })
}

function setLightState(req, res, next){
    const id = req.params.lightId;
    LightsService.setLightProperty(id, req.body)
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            next(err);
        })
}



function getGroups(req, res, next) {
    //get all clients
    LightsService.getGroups()
        .then(groups => {
            res.json(groups)
        })
        .catch(err => {
            next(err);
        })

}

function getGroupById(req, res, next) {
    LightsService.getGroupById(req.params.groupId)
        .then(group => {
            if(group){
                res.json(group);
            }
            else {
                //return not found
                next();
            }
        })
}

function setGroupState(req, res, next){
    const id = req.params.lightId;
    res.send("not implemented");
    // LightsService.setGroupProperty(id, req.body)
    //     .then(result => {
    //         res.json(result)
    //     })
    //     .catch(err => {
    //         next(err);
    //     })
}


function getScenes(req, res, next) {
    //get all clients
    LightsService.getScenes()
        .then(groups => {
            res.json(groups)
        })
        .catch(err => {
            next(err);
        })

}

function getSceneById(req, res, next) {
    LightsService.getSceneById(req.params.groupId)
        .then(group => {
            if(group){
                res.json(group);
            }
            else {
                //return not found
                next();
            }
        })
}

function setSceneState(req, res, next){
    const id = req.params.lightId;
    res.send("not implemented");
    // LightsService.setGroupProperty(id, req.body)
    //     .then(result => {
    //         res.json(result)
    //     })
    //     .catch(err => {
    //         next(err);
    //     })
}


export default router