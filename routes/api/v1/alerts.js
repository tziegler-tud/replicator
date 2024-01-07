import express from 'express';
var router = express.Router();
import AlertService from "../../../services/AlertService.js";



//alerts api router
/* hooked at /api/v1/alerts */

router.get("/", getAll);
router.post("/:identifier/addAction", addAction);
router.post("/:identifier/addPhase", addPhase);
router.post("/:identifier/removePhase", removePhase);
router.post("/:identifier/start", startAlert);
router.post("/:identifier/stop", stopAlert);
router.delete("/:identifier/actions/:actionId", removeAction);
router.put("/:identifier/actions/:actionId", updateAction);
router.put("/:identifier/phases/:phaseId", updatePhase);
router.delete("/:identifier/phases/:phaseId", removePhaseById);


router.put("/:identifier", updateAlert);





async function getAll(req, res, next) {
    const alerts = AlertService.getAll();
    res.json(alerts);
}

async function updateAlert(req, res, next){
    const identifier = req.params.identifier;
    const data = req.body;
    AlertService.update(identifier, data)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}
function addPhase(req, res, next) {
    const identifier = req.params.identifier;
    AlertService.addPhase(identifier)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}
function addAction(req, res, next) {
    const identifier = req.params.identifier;
    const phaseIndex = req.body.phase;
    const action = req.body.action;
    AlertService.addAction(identifier, action, phaseIndex)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}

function updateAction(req, res, next) {
    const identifier = req.params.identifier;
    const actionId = req.params.actionId;
    const data = req.body;
    AlertService.updateAction(identifier, actionId, data)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}


function removeAction(req, res, next) {
    const identifier = req.params.identifier;
    const actionId = req.params.actionId;
    AlertService.removeAction(identifier, actionId)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}

function updatePhase(req, res, next){
    const identifier = req.params.identifier;
    const phaseId = req.params.phaseId;
    const data = req.body;

    AlertService.updatePhase(identifier, phaseId, data)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })


}

async function removePhase(req, res, next){
    const identifier = req.params.identifier;
    const phaseId = req.params.phaseId;

    AlertService.removePhase(identifier)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}

async function removePhaseById(req, res, next){
    const identifier = req.params.identifier;
    const phaseId = req.params.phaseId;

    AlertService.removePhaseById(identifier, phaseId)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            next(err);
        })
}

async function startAlert(req, res, next){
    const identifier = req.params.identifier;
    const alert = AlertService.getByIdentifier(identifier);
    if(!alert) {
        next("Failed to start alert: Unknown identifier.")
    }
    else {
        try{
            const result = AlertService.activate(alert);
            res.json(result);
        }
        catch(e){
            next(e);
        }
    }
}
async function stopAlert(req, res, next){
    const identifier = req.params.identifier;
    const alert = AlertService.getByIdentifier(identifier);
    if(!alert) {
        next("Failed to stop alert: Unknown identifier.")
    }
    else {
        const result = AlertService.deactivate(alert, "Stopped by API Request");
        res.json(result);
    }
}


export default router