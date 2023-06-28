import yaml from 'js-yaml';
import fs from 'fs';
import Service from "./Service.js";
import Intent from "../classes/Intent.js";
import SettingsService from "./SettingsService.js";
import db from '../schemes/mongo.js';
import mongoose from "mongoose";
import {refJSON} from "../helpers/utility.js";
const IntentHandler = db.IntentHandler;
import {VariableExpectation} from '../helpers/enums.js';

import skillImporter from "../skills/importer.js";
import ExecutionContext from "../classes/ExecutionContext.js";
import IntentService from "./IntentService.js";
import ClientService from "./ClientService.js";




/**
 * @typedef SlotObject {Object}
 * @property {String} title
 * @property {String[]} values
 */

class IntentHandlerService extends Service{
    constructor(){
        super();
        this.debugLabel = "IntentHandlerService: ";
        this.skills = {};
    }

    initFunc(){
        let self = this;
        return new Promise(function(resolve, reject){
            //load skills
            self.skills = skillImporter.getSkills();
            self.skillArray = createSkillArray();
            resolve()

            /**
             *
             * @returns {Skill[]}
             */
            function createSkillArray(){
                let array = [];
                for (let group in self.skills){
                    for (let entity in self.skills[group]){
                        for (let skillSet in self.skills[group][entity]) {
                            for (let skill in self.skills[group][entity][skillSet]) {
                                //check for unique identifier
                                let skillObject = self.skills[group][entity][skillSet][skill];
                                if(array.find(s => s.identifier === skillObject.identifier)){
                                    //skill identifier not unique
                                    self.debug("Failed to load skills: Identifier not unique: " + skillObject.identifier);
                                    self.skills[group][entity][skillSet][skill] = undefined;
                                    continue;
                                }
                                array.push(skillObject);
                            }
                        }
                    }
                }
                return array;
            }
        })
    }

    getSkillByIdentifier(skillIdentifier){
        let found = this.skillArray.find(skill => {
            return skill.identifier === skillIdentifier;
        })
        if(!found) {
            console.log("Skill not found: " + skillIdentifier);
            return undefined;
        }
        else {
            return found;
        }
    }

    getSkills() {
        return this.skills;
    };

    getSkillArray() {
        return this.skillArray;
    }

    async getAll(){
        let result = await IntentHandler.find();
        return result;
    }

    async groupByIntent(){
        //get all intents
        const intents = IntentService.getAllIntents();
        const grouped = await IntentHandler.aggregate([
            {
                $group: {
                    _id: "$intent",
                    intentHandlers: { $push: "$$ROOT" }
                }
            }
        ])
        const intentMap = {};
        intents.forEach(function(intent){
          intentMap[intent.identifier] = [];
        })
        grouped.forEach(function(group){
            intentMap[group._id] = group.intentHandlers;
        })
        return intentMap;
    }

    async groupByClients(){
        const clients = await ClientService.getAllClients();
        const docs = await IntentHandler.find().populate("clients");
        const clientMap = {}
        clients.forEach(function(client){
            clientMap[client.identifier] = [];
        })
        docs.forEach(function(intentHandler){
            intentHandler.clients.forEach(function(client){
              clientMap[client.identifier].push(intentHandler.toJSON());
            })
        })
        return clientMap;
    }

    /**
     *
     * @param intent {Intent}
     */
    initVariablesFromIntent(intent){
        //get intent variables
        let variables = {
            required: {},
            optional: {},
            forbidden: {},
        }
        Object.keys(intent.variables).forEach(key => {
            variables.optional[key] = "string";
        })
        return variables;
    }


    async create(data){
        //intent is required
        const intent = IntentService.getIntent(data.intent);
        if(!intent) throw new Error("Intent not found.");

        let defaultHandler = {
            identifier: undefined,
            clients: [],
            allowAllClients: false,
            intent: undefined,
            variables: {
                required: {},
                optional: {},
                forbidden: {},
            },
            actions: [],
            finisher: {},
        }

        let handlerBlueprint = Object.assign(defaultHandler, data)
        let intentHandler = new IntentHandler(handlerBlueprint);

        //check if variables were entered
        if (data.variables){

        }
        else {
            Object.keys(intent.variables).forEach(key => {
                // intentHandler.addVariable(key, "string");
                intentHandler.addVariable(key, intent.variables[key]);
            })
        }

        let result = await intentHandler.save();
        return result;
    }

    /**
     * returns an intentHandler
     * @param id {String} unique Intent id
     * @returns {Promise<IntentHandler>}
     */
    getById(id) {
        return IntentHandler.findById(id);
    }

    /**
     * returns an intentHandler as json, with clients populated with their runtime objects
     * @param id {String} intentHandler id
     * @returns {Promise<Object>}
     */
    getByIdJSON(id) {
        let self = this;
        return new Promise(function(resolve, reject){
            IntentHandler.findById(id)
                .then(intentHandler => {
                    let json = intentHandler.toJSON();
                    let rtClients = self.populateRuntimeClients(json.clients);
                    let rtIntent = self.populateRuntimeIntent(json.intent);
                    json.clients = rtClients;
                    json.intent = rtIntent;
                    resolve(json);
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    /**
     * returns an intentHandler
     * @param identifier {String} unique Intent identifier
     * @returns {Promise<IntentHandler>}
     */
    getByIdentifier(identifier) {
        return IntentHandler.findOne({identifier: identifier}).populate("clients");
    }

    /**
     *
     * @param identifier {String} intent unique identifier
     */
    getHandlersForIntent(identifier) {
        let self = this;
        const intent = IntentService.getIntent(identifier);
        return IntentHandler.find({intent: intent.identifier});
    }

    /**
     *
      * @param intent {Intent}
     */
    async getMatchingHandlers(intent, slots) {
        let handlers = await IntentHandler.find({intent: intent.identifier});
        let qualified = []
        if(!handlers) {
            return []
        }
        else {
            handlers.forEach(handler => {
                if (handler.checkHandler(slots)) qualified.push(handler);
            })
            return qualified;
        }
    }

    /**
     *
     * @param identifier
     * @param data
     * @returns {Promise<*>}
     */
    async update(identifier, data){
        let result = await IntentHandler.findOne({identifier: identifier});
        //check if clients were updated
        if(data.clients) {
            let clients = [];
            data.clients.forEach(clientId => {
                //find client
                let client = ClientService.getByIdSync(clientId)
                clients.push(client.clientId);
            })
            data.clients = clients;
        }
        Object.assign(result, data);
        return await result.save();
    }

    async remove(identifier){
        return IntentHandler.deleteOne({identifier: identifier});
    }

    /**
     *
     * @param identifier
     * @param action
     * @returns {Promise<*>}
     */
    async addAction(identifier, action) {
        let result = await IntentHandler.findOne({identifier: identifier});
        //create id now
        var actionId = mongoose.Types.ObjectId();
        action._id = actionId;

        //create variables from skill
        const skill = this.getSkillByIdentifier(action.skill.identifier);
        if(!skill) throw new Error("Skill not found: " + action.skill.identifier);

        action.variables = [];

        Object.keys(skill.variables).forEach(variable => {
            const type = skill.variables[variable];
            action.variables.push({
                name: variable,
                type: type,
                mapping: {},
                fallback: undefined,
            })
        })

        result.actions.push(action);
        await result.save();
        return action;
    }

    /**
     *
     * @param identifier {String} unique intentHandler identifier
     * @param actionObjectId  {String} unique action identifier
     * @returns {Promise<*>}
     */
    async removeAction(identifier, actionObjectId) {
        let result = await IntentHandler.findOne({identifier: identifier});
        let index = result.actions.findIndex(action => {
            return action._id.toString() === actionObjectId.toString()
        })
        if(index > -1) {
            result.actions.splice(index, 1);
            result.markModified("actions");
            return await result.save();
        }
        else throw new Error("Action not found.");
    }

    /**
     *
     * @param identifier {String} unique intentHandler identifier
     * @param actionObjectId  {String} unique action identifier
     * @param action {Object} action object. overwrites previous content
     * @returns {Promise<*>}
     */
    async updateAction(identifier, actionObjectId, action) {
        let result = await IntentHandler.findOne({identifier: identifier});
        let index = result.actions.findIndex(action => {
            return action._id.toString() === actionObjectId.toString()
        })
        if(index > -1) {
            action._id = result.actions[index]._id;
            result.actions[index] = action;
            result.markModified("actions");
            return await result.save();
        }
        else throw new Error("Action not found.");
    }

    /**
     *
     * @param identifier
     * @returns {Promise<{}>}
     */
    async delete(identifier) {
        let result = await IntentHandler.findOne({identifier: identifier});
        if(!result) {
            return {};
        }
        else {
            await IntentHandler.findByIdAndDelete(result._id);
            return true;
        }
    }

    createExecutionContext(intentHandler){
        let self = this;
        return new Promise(function(resolve, reject){
            //validate
            if(!intentHandler) {
                reject("IntentHandler not found: " + identifier);
            }
            else {
                //create new executionContext
                let ec = new ExecutionContext(intentHandler);
                resolve(ec);
            }
        })
    }

    createExecutionContextFromIdentifier(identifier){
        let self = this;
        return new Promise(function(resolve, reject){
            IntentHandler.findOne({identifier: identifier})
                .then(result=> {
                    if(!result) {
                        reject("IntentHandler not found: " + identifier);
                    }
                    else {
                        //create new executionContext
                        let ec = new ExecutionContext(result);
                        resolve(ec);
                    }
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    /**
     *
     * @param array {IntentHandler[]}
     * @param property {String}
     * @returns {Object}
     */
    groupByProperty(array, property) {
        const result = {}
        array.forEach(intentHandler => {
            const groupField = refJSON(intentHandler,property);
            //check if field is in result
            if(result[groupField] === undefined) {
                result[groupField] = [];
                result[groupField].push(intentHandler);
            }
            else {
                result[groupField].push(intentHandler);
            }
        })
        return result;
    }

    populateRuntimeClients(clientDbArray) {
        let rtClients = [];
        clientDbArray.forEach(function(clientId, index){
            //find client by id
            const rtClient = ClientService.findOneById(clientId).getJSON();
            rtClients.push(rtClient)
        })
        return rtClients;
    }

    populateRuntimeIntent(intentIdentifier) {
        return IntentService.getIntent(intentIdentifier);
    }
}

export default new IntentHandlerService();
