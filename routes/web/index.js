import express from 'express';
import ClientService from "../../services/ClientService.js";
import IntentService from "../../services/IntentService.js";
var router = express.Router();

/**
 * hooked at /
 */
router.get("/", index)
router.get("/clients", clients)
router.get("/intents", intents)

function index(req, res, next){
    res.render("index");
}

function clients(req, res, next){

    //get clients
    ClientService.getAllClients()
        .then(clients => {
            res.render("clients", {
                clients: clients,
            });
        });
}

function intents(req, res, next){

    //get clients
    const intents = IntentService.getAllIntents()
    res.render("intents", {
        intents: intents,
    });
}
export default router;
