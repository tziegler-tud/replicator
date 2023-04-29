import express from 'express';
var router = express.Router();

import intentService from "../../../services/IntentService.js";

import endpoints from '../../../config/endpoints.json' assert { type: 'json' };
import IntentHandlerService from "../../../services/IntentHandlerService.js";



//router for client interaction
/* hooked at /api/v1/intentHandler */

router.get("/", getIntentHandlers);
router.post("/:id/addAction", addAction);
router.delete("/:id/action/:actionId", removeAction);
router.put("/:id/action/:actionId", updateAction);
router.put("/:id", update);
router.post("/", add);
router.delete("/:id", remove);



function getIntentHandlers(req, res, next) {

}

function add(req, res, next) {
    const id = req.params.id;
    const data = req.body;
    IntentHandlerService.create(data)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}

function update(req, res, next) {
    const id = req.params.id;
    const data = req.body;
    IntentHandlerService.update(id, data)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}


function remove(req, res, next) {
    const id = req.params.id;
    IntentHandlerService.remove(id)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}


function addAction(req, res, next) {
    const id = req.params.id;
    const data = req.body;
    IntentHandlerService.addAction(id, data)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}

function updateAction(req, res, next) {
    const id = req.params.id;
    const actionId = req.params.actionId;
    const data = req.body;
    IntentHandlerService.updateAction(id, actionId, data)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}



function removeAction(req, res, next){
    const id = req.params.id;
    const actionId = req.params.actionId;
    IntentHandlerService.removeAction(id, actionId)
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            next(err);
        })
}


export default router