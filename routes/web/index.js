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
    SKILLS: "SkillModule",
    ENTITIES: "EntitiesModule",
}
/**
 * hooked at /
 */
router.get("/", index)
router.get("/clients", clients)
router.get("/clients/add", addClient)
router.get("/clients/:id", clientDetails)
router.get("/intents", intents)
router.get("/intenthandlers", intenthandlers)
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

function clients(req, res, next){

    //get clients
    ClientService.getAllClients()
        .then(clients => {
            res.render("clients", {
                clients: {
                    connected: clients.filter(client => client.connection.connected),
                    disconnected: clients.filter(client => !client.connection.connected)
                },
                page: {
                    modules: [
                        MODULES.CLIENTS,
                    ],
                    nav: {
                        currentEntry: "clients"
                    }
                }
            });
        });
}

function addClient(req, res, next){
    res.render("clients/add", {
        page: {
            modules: [
                MODULES.CLIENTS,
            ],
            nav: {
                currentEntry: "clients"
            }
        }
    });
}

function clientDetails(req, res, next){

}

function intents(req, res, next){

    //get clients
    const intents = IntentService.getAllIntents()
    res.render("intents", {
        intents: intents,
        page: {
            modules: [

            ],
            nav: {
                currentEntry: "intents"
            }
        }
    });
}

function skills(req, res, next){

    //get clients
    const skills = IntentHandlerService.getSkills()
    res.render("skills", {
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
            res.render("intenthandlers", {
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
