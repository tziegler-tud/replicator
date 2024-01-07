import express from 'express';
import ClientService from "../../services/ClientService.js";
import IntegrationService from "../../services/IntegrationService.js";
import ApiError from "../../helpers/ApiError.js";
var router = express.Router();
import MODULES from "./modules.js";

/**
 * hooked at /clients
 */

router.get("/", integrations)
router.get("/:name", details)

function integrations(req, res, next){

    //get clients
    const loaded = IntegrationService.getActive();
    res.render("integrations/all", {
        integrations: loaded,
        page: {
            modules: [
                MODULES.INTEGRATIONS,
            ],
            nav: {
                currentEntry: "integrations"
            }
        }
    });
}

function details(req, res, next){
    const integration = IntegrationService.getDetails(req.params.name);
    const reloaded = req.query.reload;
    res.render("integrations/details", {
        integration: integration,
        page: {
            reload: reloaded,
            modules: [
                MODULES.INTEGRATIONS,
            ],
            nav: {
                currentEntry: "integrations"
            }
        }
    })
}

export default router;
