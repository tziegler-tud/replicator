import express from 'express';
var router = express.Router();

import intentService from "../../../services/IntentService.js";

import endpoints from '../../../config/endpoints.json' assert { type: 'json' };



//router for client interaction
/* hooked at /api/v1/intents */

router.get("/", getIntents);
router.get("/:title", getIntentByTitle);


function getIntents(req, res, next) {
    //get all clients
    res.json(intentService.intents)
}

function getIntentByTitle(req, res, next) {
    const intent = intentService.getIntent(req.params.title)
    if(intent){
        res.json(intent);
    }
    else {
        //return not found
        next();
    }

}


export default router