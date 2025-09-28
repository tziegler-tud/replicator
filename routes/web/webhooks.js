import express from 'express';

import WebhookService from "../../services/WebhookService.js";
import LightsService from "../../services/LightsService.js";
import SkillService from "../../services/SkillService.js";
var router = express.Router();
import MODULES from "./modules.js";
import SensorService from "../../services/SensorService.js";

/**
 * hooked at /webhooks
 */

router.get("/", getAll)
router.get("/:identifier", details)
router.get("/:identifier/actions/:actionId", editAction);

function getAll(req, res, next){

    //get clients
    const alerts = WebhookService.getAll();
    res.render("webhooks/all", {
        alerts: alerts,
        page: {
            modules: [
                MODULES.WEBHOOKS,
            ],
            nav: {
                currentEntry: "webhooks"
            },
            hooks: hooks,
        }
    });
}

async function details(req, res, next){
    const identifier = req.params.identifier;
    const reloaded = req.query.reload;
    const lights = await LightsService.getLights();
    const lightGroups = await LightsService.getGroups();
    const scenes = await LightsService.getScenes();
    const sensors = await SensorService.getSensors();
    const skills = SkillService.getAll();
    const entities = {
        lights: lights,
        lightGroups: lightGroups,
        scenes: scenes,
        sensors: sensors,
    }

    const hook = WebhookService.getByIdentifier(identifier);
    if(!hook) {
        let err = new Error("Failed to get Webhook with identifier: " + identifier);
        next(err)
    }
    res.render("webhooks/details", {
        hook: hook,
        page: {
            reload: reloaded,
            modules: [
                MODULES.AlertsDetais,
            ],
            nav: {
                currentEntry: "webhooks"
            },
            hook: hook,
            entities: entities,
            skills: skills,
        }
    })
}
async function editAction(req, res, next){
    const identifier = req.params.identifier;
    const actionId = req.params.actionId;

    const hook = WebhookService.getByIdentifier(identifier);
    const lights = await LightsService.getLights(true);
    const lightGroups = await LightsService.getGroups(true);
    const scenes = await LightsService.getScenes(true);
    const sensors = await SensorService.getSensors();
    const skills = SkillService.getAll();
    const entities = {
        lights: lights,
        lightGroups: lightGroups,
        scenes: scenes,
        sensors: sensors,
    }

    let action = undefined;

    try {
        action = webhook.getAllActions().find(action => action._id.toString() === actionId.toString());
        if(!action) next(new Error("Action id missmatch."));
    }
    catch(err) {
        next(err);
    }
    const skill = SkillService.getSkillByIdentifier(action.skill.identifier);
    res.render("webhooks/editAction", {
        hook: hook,
        action: action,
        skill: skill,
        page: {
            modules: [
                MODULES.AlertsAction,
            ],
            nav: {
                currentEntry: "webhooks"
            },
            hook: hook,
            entities: entities,
            skills: skills,
            skill: skill,
            action: action,
        }
    })
}
export default router;
