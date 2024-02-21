import yaml from 'js-yaml';
import fs from 'fs';
import Service from "./Service.js";
import HueIntegration from "../integrations/hue/HueIntegration.js";
import DeconzIntegration from "../integrations/deconz/DeconzIntegration.js";

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
        try {
            const loader = await integration.load(args);
        }
        catch(e){
            //failed to load integration.
            console.warn("Failed to load integration: " + integration.readableName);
            return integration;
        }
        this.loaded.push(integration)
        return integration;

    }

    getActive(){
        return this.loaded;
    }

    getDetails(uniqueName){
        const integration = this.loaded.find(el => el.uniqueName === uniqueName);
        return integration;
    }

    integrations = {
        HUE: HueIntegration,
        DECONZ: DeconzIntegration,
    }
}
export default new IntegrationService();