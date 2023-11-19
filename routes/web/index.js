import express from 'express';
import ClientService from "../../services/ClientService.js";
import IntentService from "../../services/IntentService.js";
import IntentHandlerService from "../../services/IntentHandlerService.js";
import SkillService from "../../services/SkillService.js";
var router = express.Router();
import MODULES from "./modules.js";

/**
 * hooked at /
 */
router.get("/", index)
router.get("/skills", skills)

function index(req, res, next){
    ClientService.getClientStatus()
        .then(clientStatus => {
            res.render("index", {
                clients: {
                    clients: clientStatus.clients,
                    stats: clientStatus.stats,
                },
                page: {
                    modules: [
                        MODULES.DASHBOARD,
                    ],
                    nav: {
                        currentEntry: "dashboard"
                    },
                    clients: {
                        clients: clientStatus.clients,
                        stats: clientStatus.stats,
                    },
                }
            });
        })

}

function skills(req, res, next){

    //get clients
    const skills = SkillService.getAll()
    res.render("skills/all", {
        skills: skills,
        page: {
            modules: [

            ],
            nav: {
                currentEntry: "skills"
            }
        }
    });
}

function intenthandlers(req, res, next){

    IntentHandlerService.getAll()
        .then(intenthandlers => {
            res.render("intenthandlers/all", {
                intenthandlers: intenthandlers,
                page: {
                    modules: [

                    ],
                    nav: {
                        currentEntry: "intenthandlers"
                    }
                }
            });
        });
}
export default router;
