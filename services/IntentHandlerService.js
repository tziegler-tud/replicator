import yaml from 'js-yaml';
import fs from 'fs';
import Service from "./Service.js";
import Intent from "../classes/Intent.js";
import SettingsService from "./SettingsService.js";
import db from '../schemes/mongo.js';
const IntentHandler = db.IntentHandler;
import {VariableExpectation} from '../helpers/enums.js';

import skills from "../skills/importer.js";




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
            self.skills = skills;
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


    async create(data){
        let intentHandler = new IntentHandler(data);
        let result = await intentHandler.save();
        return result;
    }

    /**
     * returns an intent
     * @param identifier {String} unique Intent identifier
     * @returns {Intent}
     */
    async getByIdentifier(identifier) {
        let result = await IntentHandler.findOne({identifier: identifier});
        return result;
    }

    /**
     *
     * @param identifier
     * @param data
     * @returns {Promise<*>}
     */
    async update(identifier, data){
        let result = await IntentHandler.findOne({identifier: identifier});
        Object.assign(result, data);
        return await result.save();
    }

    /**
     *
     * @param identifier
     * @param action
     * @returns {Promise<*>}
     */
    async addAction(identifier, action) {
        let result = await IntentHandler.findOne({identifier: identifier});
        result.actions.push(action);
        return await result.save();
    }

    /**
     *
     * @param identifier {String} unique intentHandler identifier
     * @param actionObjectId  {String} unique action identifier
     * @returns {Promise<*>}
     */
    async removeAction(identifier, actionObjectId) {
        let result = await IntentHandler.findOne({identifier: identifier});
        let index = result.actions.indexOf(action => action.id.toString() === actionObjectId.toString())
        if(index > -1) {
            result.actions.splice(index, 1);
            result.markModified("actions");
            return await result.save();
        }
        else return {};
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
        let index = result.actions.indexOf(action => action.id.toString() === actionObjectId.toString())
        if(index > -1) {
            result.actions[index] = action;
            result.markModified("actions");
            return await result.save();
        }
        else return {};
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

    async run(identifier, args){
        let result = await IntentHandler.findOne({identifier: identifier});
        if(!result) {
            return {};
        }
        else {
            let self = this;
            result.actions.forEach(function(action){
                const skillIdentifier = action.skill.identifier;
                const config = action.config;

                //find skill
                let skill = self.getSkillByIdentifier(skillIdentifier);
                skill.run({
                    handlerArgs: args,
                    configuration: config,
                    intentHandler: result,
                })
            })
        }
    }
}

export default new IntentHandlerService();
