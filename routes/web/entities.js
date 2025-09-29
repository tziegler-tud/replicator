import express from 'express';
import LightsService from "../../services/LightsService.js";
var router = express.Router();
import MODULES from "./modules.js";
import SensorService from "../../services/SensorService.js";
import SystemEntityService from "../../services/SystemEntityService.js";

/**
 * hooked at /intents
 */

router.get("/", entities)
router.get("/lights/:id", lightDetails)
router.get("/groups/:id", groupDetails)
router.get("/scenes/:id", sceneDetails)
router.get("/sensors/:id", sensorDetails)


function entities(req, res, next){

    //get clients
    const lightsP = LightsService.getLights();
    const lightGroupsP = LightsService.getGroups();
    const scenesP = LightsService.getScenes();
    const sensorsP = SensorService.getSensors();
    const system = SystemEntityService.getEntities()

    Promise.all([lightsP, lightGroupsP,scenesP, sensorsP])
        .then(function([lights, lightGroups, scenes, sensors]) {
            const entities = {
                lights: lights,
                lightGroups: lightGroups,
                scenes: scenes,
                sensors: sensors,
                system: system,
            }
            res.render("entities/all", {
                entities: entities,
                page: {
                    modules: [
                        MODULES.ENTITIES,
                    ],
                    nav: {
                        currentEntry: "entities"
                    }
                }
            });
        })
}


function lightDetails(req, res, next){
    //get clients
    LightsService.getLightById(req.params.id)
        .then(light => {
            res.render("entities/details", {
                entity: light,
                page: {
                    modules: [
                        MODULES.ENTITIES,
                        MODULES.ENTITYDETAILS
                    ],
                    nav: {
                        currentEntry: "entities"
                    }
                }
            });
        })
}


function groupDetails(req, res, next){
    //get clients
    LightsService.getGroupById(req.params.id)
        .then(group => {
            res.render("entities/details", {
                entity: group,
                page: {
                    modules: [
                        MODULES.ENTITIES,
                        MODULES.ENTITYDETAILS
                    ],
                    nav: {
                        currentEntry: "entities"
                    }
                }
            });
        })
}


function sceneDetails(req, res, next){
    //get clients
    LightsService.getSceneById(req.params.id)
        .then(scene => {
            res.render("entities/details", {
                entity: scene,
                page: {
                    modules: [
                        MODULES.ENTITIES,
                        MODULES.ENTITYDETAILS
                    ],
                    nav: {
                        currentEntry: "entities"
                    }
                }
            });
        })
}

function sensorDetails(req, res, next){
    //get clients
    SensorService.getSensorById(req.params.id)
        .then(scene => {
            res.render("entities/details", {
                entity: scene,
                page: {
                    modules: [
                        MODULES.ENTITIES,
                        MODULES.ENTITYDETAILS
                    ],
                    nav: {
                        currentEntry: "entities"
                    }
                }
            });
        })
}
export default router;
