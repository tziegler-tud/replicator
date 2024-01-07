import Dashboard from "./modules/dashboard.js"
import Clients from "./modules/clients/clients.js"
import ClientDetails from "./modules/clients/clientDetails.js"
import Intents from "./modules/intents.js"
import IntentHandlers from "./modules/intentHandler/intentHandlers.js"
import IntentHandlerAdd from "./modules/intentHandler/intentHandlerAdd.js"
import IntentHandlerDetails from "./modules/intentHandler/intentHandlerDetails.js"
import IntentHandlerAction from "./modules/intentHandler/intentHandlerAction";
import Entities from "./modules/entities";
import Integrations from "./modules/integrations";
import Alerts from "./modules/alerts/alerts.js";
import AlertDetails from "./modules/alerts/alertDetails.js";
import AlertAction from "./modules/alerts/alertAction.js";

export default class ModuleLoader {
    constructor(){
        this.modules = [Dashboard, Clients, ClientDetails, Intents, IntentHandlers, IntentHandlerAdd, IntentHandlerDetails, IntentHandlerAction, Entities, Integrations, Alerts, AlertDetails, AlertAction];

    }

    async load({moduleName, args}) {
        const module = this.modules.find(m => m.name === moduleName);
        if (!module) {
            console.warn("Failed to load module '" + moduleName + "': Module not found");
        }
        else {
            return await module.init(args);
        }
    }
}