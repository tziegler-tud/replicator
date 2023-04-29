import express from 'express';
import ClientService from "../../services/ClientService.js";
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
 * hooked at /clients
 */

router.get("/", clients)
router.get("/add", addClient)
router.get("/:id", clientDetails)

function clients(req, res, next){

    //get clients
    ClientService.getAllClients()
        .then(clients => {
            res.render("clients/all", {
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
    //get clients
    const id = req.params.id;
    ClientService.getById(id)
        .then(client => {
            res.render("clients/details", {
                client: client,
                clientDetails: client.getClientDetails(),
                page: {
                    modules: [
                        MODULES.CLIENTS,
                    ],
                    nav: {
                        currentEntry: "clients"
                    }
                }
            })
        })
        .catch(err => {
            next(err);
        })

}


export default router;
