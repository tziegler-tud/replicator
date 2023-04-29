import Dashboard from "./modules/dashboard.js"
import Clients from "./modules/clients.js"
import Intents from "./modules/intents.js"
import IntentHandlers from "./modules/intentHandler/intentHandlers.js"
import IntentHandlerAdd from "./modules/intentHandler/intentHandlerAdd.js"
import IntentHandlerDetails from "./modules/intentHandler/intentHandlerDetails.js"
import IntentHandlerAction from "./modules/intentHandler/intentHandlerAction";

export default class ModuleLoader {
    constructor(){
        this.modules = [Dashboard, Clients, Intents, IntentHandlers, IntentHandlerAdd, IntentHandlerDetails, IntentHandlerAction];

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