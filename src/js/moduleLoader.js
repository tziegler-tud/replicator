import Dashboard from "./modules/dashboard.js"
import Clients from "./modules/clients.js"

export default class ModuleLoader {
    constructor(){
        this.modules = [Dashboard, Clients];

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