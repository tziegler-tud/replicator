import express from 'express';
import ClientService from "../../services/ClientService.js";
var router = express.Router();

const MODULES = {
    DASHBOARD: "DashboardModule",
    CLIENTS: "ClientModule",
    CLIENTDETAILS: "ClientDetailsModule",
    INTENTS: "IntentModule",
    INTENTHANDLERS: "IntentHandlerModule",
    SKILLS: "SkillModule",
    ENTITIES: "EntitiesModule",
    INTEGRATIONS: "IntegrationsModule"
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
                    },
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

async function clientDetails(req, res, next){
    //get clients
    const id = req.params.id;
    let client = undefined;
    try {
        client = await ClientService.getById(id)
    }
    catch(e){
        next(e);
    }
    try {
        //get device settings via tcp
        const deviceSettings = await client.getDeviceSettings()
        const interfaces = await client.getInterfaces();
        render(deviceSettings, interfaces, undefined);
    }
    catch(e){
        render(undefined, undefined, e)
    }

    function render(deviceSettings, interfaces, error){
        res.render("clients/details", {
            client: client,
            clientDetails: client.getClientDetails(),
            page: {
                modules: [
                    MODULES.CLIENTDETAILS,
                ],
                nav: {
                    currentEntry: "clients"
                },
                client: client.getJSON(),
                clientDetails: client.getClientDetails(),
                deviceSettings: deviceSettings,
                interfaces: interfaces,
                error: error,
            }
        })
    }

}


export default router;
