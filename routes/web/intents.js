import express from 'express';
import ClientService from "../../services/ClientService.js";
import IntentService from "../../services/IntentService.js";
var router = express.Router();
import MODULES from "./modules.js";

/**
 * hooked at /intents
 */

router.get("/", intents)
router.get("/:identifier", intentDetails)


function intents(req, res, next){

    //get clients
    const intents = IntentService.getAllIntents()
    const slots = IntentService.getAllSlots();
    const macros = IntentService.getAllMacros();
    res.render("intents/all", {
        intents: intents,
        slots: slots,
        macros: macros,
        page: {
            modules: [
                MODULES.INTENTS,
            ],
            nav: {
                currentEntry: "intents"
            }
        }
    });
}


function intentDetails(req, res, next){
    //get clients
    const identifier = req.params.identifier;
    IntentService.getIntentPromise(identifier)
        .then(intent => {
            res.render("intents/details", {
                intent: intent,
                page: {
                    modules: [
                        MODULES.INTENTS,
                    ],
                    nav: {
                        currentEntry: "intents"
                    }
                }
            })
        })
        .catch(err => {
            next(err);
        })

}

export default router;
