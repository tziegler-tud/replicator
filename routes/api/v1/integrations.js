import express from 'express';
import IntegrationService from "../../../services/IntegrationService.js";
import ApiError from "../../../helpers/ApiError.js";
var router = express.Router();

const MODULES = {
    DASHBOARD: "DashboardModule",
    CLIENTS: "ClientModule",
    INTENTS: "IntentModule",
    INTENTHANDLERS: "IntentHandlerModule",
    SKILLS: "SkillModule",
    ENTITIES: "EntitiesModule",
    INTEGRATIONS: "IntegrationsModule"
}
/**
 * hooked at /clients
 */

router.get("/", integrations)
router.get("/:name", details)
router.post("/:name/reload", reload)

function integrations(req, res, next){

    //get clients
    const loaded = IntegrationService.getActive();
    res.json(loaded);
}

function details(req, res, next){
    const integration = IntegrationService.getDetails(req.params.name)
    res.json(integration);
}


function reload(req, res, next){
    const integration = IntegrationService.getDetails(req.params.name);
    if(integration){
        integration.reload()
            .then(result => {
                res.json({status: integration.status});
            })
            .catch(err => next(err))
    }
    else {
        next(new ApiError("Failed to reload integration: Unknown identifier '" + req.params.name + "'.", 400))
    }
}

export default router;
