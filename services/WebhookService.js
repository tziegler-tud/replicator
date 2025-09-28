import Service from "./Service.js";
import Webhook from "../classes/Webhooks/Webhook.js";
import WebhookExecutionContext from "../classes/Webhooks/WebhookExecutionContext.js";
import db from '../schemes/mongo.js';
const DbWebhooks = db.Webhook;


class WebhookService extends Service {

    static properties = {
        SETTINGS: "settings",
    }


    constructor() {
        super();
        this.serviceName = "WebhookService";

        /**
         *
         * @type {Webhook[]}
         */
        this.hooks = [];
        this.log = [];
    }

    async initFunc(){
        try {
            this.hooks = await this.loadFromDb();

        }
        catch(e){
            console.error("Failed to load Webhook database.");
        }
        return true;
    }

    async loadFromDb(){
        let hooks = []
        const results = await DbWebhooks.find().exec();
        results.forEach(result => {
            const hook = Webhook.fromDb(result);
            hooks.push(hook);
        })
        return hooks;
    }

    getAll(){
        return this.hooks;
    }


    async create(data){
        let defaultProperties = [
            {
                key: WebhookService.properties.SETTINGS,
                values: []
            },
        ]
        let defaultHook = {
            identifier: undefined,
            name: "New Webhook",
            slug: undefined,
            variables: {},
            actions: [],
            finisher: {},
            properties: defaultProperties
        }

        let blueprint = Object.assign(defaultHook, data)
        let hook = new Webhook(blueprint);
        await hook.save();
        this.hooks.push(hook);
        return hook;
    }

    update(identifier, data={}){
        return new Promise((resolve, reject) => {
            const hook = this.getByIdentifier(identifier);
            if(!hook){
                reject("No matching hook found.");
            }
            else {
                hook.update(data)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    _removeInternalByIdentifier(identifier){
        const index = this.hooks.findIndex(hook => hook.identifier === identifier);
        if(index > -1){
            this.hooks.splice(index, 1);
        }
    }

    remove(identifier){
        return new Promise((resolve, reject) => {
            const hook = this.getByIdentifier(identifier);
            if(!hook){
                reject("No matching hook found.");
            }
            else {
                this._removeInternalByIdentifier(identifier);
                hook.remove()
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    execute(identifier, params){

    }

    getByIdentifier(identifier){
        return this.hooks.find(hook => hook.identifier === identifier);
    }

    setProperties(identifier, properties){
        return new Promise((resolve, reject) => {
            const hook = this.getByIdentifier(identifier);
            if(!hook){
                reject("No matching hook found.");
            }
            else {
                hook.setProperties(properties)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    addAction(identifier, actionData, phaseIndex){
        return new Promise((resolve, reject) => {
            const hook = this.getByIdentifier(identifier);
            if(!hook){
                reject("No matching hook found.");
            }
            else {
                hook.addAction(actionData, phaseIndex)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    updateAction(identifier, actionId, actionData){
        return new Promise((resolve, reject) => {
            const hook = this.getByIdentifier(identifier);
            if(!hook){
                reject("No matching hook found.");
            }
            else {
                hook.updateAction(actionId, actionData)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    removeAction(identifier, actionId){
        return new Promise((resolve, reject) => {
            const hook = this.getByIdentifier(identifier);
            if(!hook){
                reject("No matching hook found.");
            }
            else {
                hook.removeAction(actionId)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }
}

export default new WebhookService();