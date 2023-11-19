import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";
import AlertService from "../../../services/AlertService.js";

/**
 * changes the state of a single Light
 */

let activateAlert = new Skill({
    identifier: "alertActivate",
    description: "Activate an alert",
    variables: {
        alertType: Skill.variableTypes.STRING,
    },
    handler: async function({handlerArgs, configuration}){
        AlertService.activateByType(handlerArgs.alertType)
    }
})

let stopAlert = new Skill({
    identifier: "alertStop",
    description: "Stop specific alert type",
    variables: {
        alertType: Skill.variableTypes.STRING,
    },
    handler: async function({handlerArgs, configuration}){
        AlertService.deactivate(handlerArgs.alertType)
    }
})

let stopAllAlerts = new Skill({
    identifier: "alertStopAll",
    description: "Stop all active alerts",
    variables: {
    },
    handler: async function({handlerArgs, configuration}){
        AlertService.deactivateAll()
    }
})

export default {activateAlert, stopAlert, stopAllAlerts}