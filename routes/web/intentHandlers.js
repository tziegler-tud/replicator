import express from 'express';
import ClientService from "../../services/ClientService.js";
import IntentService from "../../services/IntentService.js";
import IntentHandlerService from "../../services/IntentHandlerService.js";
var router = express.Router();

const MODULES = {
    DASHBOARD: "DashboardModule",
    CLIENTS: "ClientModule",
    INTENTS: "IntentModule",
    INTENTHANDLERS: "IntentHandlerModule",
    IntentHandlerDetails: "IntentHandlerDetailsModule",
    IntentHandlerAction: "IntentHandlerActionModule",
    IntentHandlerAdd: "IntentHandlerAddModule",
    SKILLS: "SkillModule",
    ENTITIES: "EntitiesModule",
}
/**
 * hooked at /intenthandlers
 */

router.get("/", allByIntents)
router.get("/byClients", allByClients)
router.get("/edit/:id/action/add", addAction)
router.get("/edit/:id/action/:actionId", editAction)
router.get("/edit/:id", editIntentHandler)
router.get("/add", addIntentHandler)


function allByIntents(req, res, next){
    IntentHandlerService.groupByIntent()
        .then(intentHandlersGrouped => {
            res.render("intenthandlers/all", {
                intentHandlersGrouped: intentHandlersGrouped,
                page: {
                    modules: [
                        MODULES.INTENTHANDLERS,
                    ],
                    nav: {
                        currentEntry: "intenthandlers"
                    }
                }
            });
        });
}


function allByClients(req, res, next){
    IntentHandlerService.groupByClients()
        .then(intentHandlersGrouped => {
            res.render("intenthandlers/all", {
                intentHandlersGrouped: intentHandlersGrouped,
                page: {
                    modules: [
                        MODULES.INTENTHANDLERS,
                    ],
                    nav: {
                        currentEntry: "intenthandlers"
                    }
                }
            });
        });
}


function editIntentHandler(req, res, next){
    //get clients
    const id = req.params.id;
    IntentHandlerService.getByIdJSON(id)
        .then(intentHandlerJSON => {
            ClientService.getAllClients()
                .then(clients => {
                    const skills = IntentHandlerService.getSkills();
                    res.render("intenthandlers/details", {
                        intentHandler: intentHandlerJSON,
                        page: {
                            modules: [
                                MODULES.INTENTHANDLERS,  MODULES.IntentHandlerDetails,
                            ],
                            nav: {
                                currentEntry: "intenthandlers"
                            },
                            intentHandler: intentHandlerJSON,
                            skills: skills,
                            clients: clients,
                        }
                    })
                })
        })
        .catch(err => {
            next(err);
        })

}


function addAction(req, res, next){
    //get clients
    const id = req.params.id;
    IntentHandlerService.getByIdJSON(id)
        .then(intentHandlerJSON => {
            const skills = IntentHandlerService.getSkills();
            res.render("intenthandlers/addAction", {
                intentHandler: intentHandlerJSON,
                page: {
                    modules: [
                        MODULES.INTENTHANDLERS,  MODULES.IntentHandlerAction,
                    ],
                    nav: {
                        currentEntry: "intenthandlers"
                    },
                    intentHandler: intentHandlerJSON,
                    skills: skills,
                }
            })
        })
        .catch(err => {
            next(err);
        })

}

function editAction(req, res, next){
    //get clients
    const id = req.params.id;
    const actionId = req.params.actionId;
    IntentHandlerService.getByIdJSON(id)
        .then(intentHandlerJSON => {
            const action = intentHandlerJSON.actions.find(action => action._id.toString() === actionId.toString());
            if(!action) {
                throw new Error("Action id missmatch.")
            }
            const skills = IntentHandlerService.getSkills();
            const skill = IntentHandlerService.getSkillByIdentifier(action.skill.identifier);
            res.render("intenthandlers/editAction", {
                intentHandler: intentHandlerJSON,
                action: action,
                skill: skill,
                page: {
                    modules: [
                        MODULES.INTENTHANDLERS, MODULES.IntentHandlerAction,
                    ],
                    nav: {
                        currentEntry: "intenthandlers"
                    },
                    intentHandler: intentHandlerJSON,
                    action: action,
                    skills: skills,
                    skill: skill,
                }
            })
        })
        .catch(err => {
            next(err);
        })
}

function addIntentHandler(req, res, next){
    const identifier = req.query.intent;
    let currentIntent = undefined;

    //get all intents
    const intents = IntentService.getAllIntents();

    //get intent
    if(identifier) {
        currentIntent = IntentService.getIntent(identifier)
    }

    res.render("intenthandlers/add", {
        page: {
            modules: [
                MODULES.INTENTHANDLERS,  MODULES.IntentHandlerAdd,
            ],
            nav: {
                currentEntry: "intenthandlers"
            },
        },
        data: {
            intents: intents,
            currentIntent: currentIntent
        },
    });
}

export default router;
