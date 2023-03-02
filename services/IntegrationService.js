import yaml from 'js-yaml';
import fs from 'fs';
import Service from "./Service.js";
import HueIntegration from "../integrations/hue/hue.js";
import DeconzIntegration from "../integrations/deconz/deconz.js";

/**
 * @typedef SlotObject {Object}
 * @property {String} title
 * @property {String[]} values
 */

class IntegrationService extends Service{
    constructor(){
        super();
        /**
         * @type {Integration[]}
         */
        this.loaded = [];
    }

    initFunc(args){
        let self = this;
        return new Promise(function(resolve, reject){
            console.log("IntegrationService started.")
            resolve();
        })
    }

    async loadIntegration(integrationClass, args){
        const integration = new integrationClass(args);
        const loader = await integration.load(args);
        this.loaded.push(integration)
        return true;

    }

    integrations = {
        HUE: HueIntegration,
        DECONZ: DeconzIntegration,
    }
}
export default new IntegrationService();