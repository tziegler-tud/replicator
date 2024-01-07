import express from 'express';
import ClientService from "../../services/ClientService.js";
import IntegrationService from "../../services/IntegrationService.js";
import ApiError from "../../helpers/ApiError.js";
import AlertService from "../../services/AlertService.js";
import LightsService from "../../services/LightsService.js";
import IntentHandlerService from "../../services/IntentHandlerService.js";
import SkillService from "../../services/SkillService.js";
var router = express.Router();
import MODULES from "./modules.js";

/**
 * hooked at /alerts
 */

router.get("/", alerts)
router.get("/:identifier", details)
router.get("/:identifier/actions/:actionId", editAction);

function alerts(req, res, next){

    //get clients
    const alerts = AlertService.getAll();
    res.render("alerts/all", {
        alerts: alerts,
        page: {
            modules: [
                MODULES.ALERTS,
            ],
            nav: {
                currentEntry: "alerts"
            },
            alerts: alerts,
        }
    });
}

async function details(req, res, next){
    const identifier = req.params.identifier;
    const reloaded = req.query.reload;
    const lights = await LightsService.getLights();
    const lightGroups = await LightsService.getGroups();
    const scenes = await LightsService.getScenes();
    const skills = SkillService.getAll();
    const entities = {
        lights: lights,
        lightGroups: lightGroups,
        scenes: scenes,
    }

    const alert = AlertService.getByIdentifier(identifier);
    if(!alert) {
        let err = new Error("Failed to get alert with identifier: " + identifier);
        next(err)
    }
    res.render("alerts/details", {
        alert: alert,
        page: {
            reload: reloaded,
            modules: [
                MODULES.AlertsDetais,
            ],
            nav: {
                currentEntry: "alerts"
            },
            alert: alert,
            entities: entities,
            skills: skills,
        }
    })
}
async function editAction(req, res, next){
    const identifier = req.params.identifier;
    const actionId = req.params.actionId;

    const alert = AlertService.getByIdentifier(identifier);
    const lights = await LightsService.getLights();
    const lightGroups = await LightsService.getGroups();
    const scenes = await LightsService.getScenes();
    const skills = SkillService.getAll();
    const entities = {
        lights: lights,
        lightGroups: lightGroups,
        scenes: scenes,
    }

    let action = undefined;

    try {
        action = alert.getAllActions().find(action => action._id.toString() === actionId.toString());
        if(!action) next(new Error("Action id missmatch."));
    }
    catch(err) {
        next(err);
    }
    const skill = SkillService.getSkillByIdentifier(action.skill.identifier);
    res.render("alerts/editAction", {
        alert: alert,
        action: action,
        skill: skill,
        page: {
            modules: [
                MODULES.AlertsAction,
            ],
            nav: {
                currentEntry: "alerts"
            },
            alert: alert,
            entities: entities,
            skills: skills,
            skill: skill,
            action: action,
        }
    })
}
export default router;
