import yaml from 'js-yaml';
import fs from 'fs';
import Service from "./Service.js";
import SettingsService from "./SettingsService.js";
import mongoose from "mongoose";
import {refJSON} from "../helpers/utility.js";
import skillImporter from "../skills/importer.js";



/**
 * @typedef SlotObject {Object}
 * @property {String} title
 * @property {String[]} values
 */

class SkillService extends Service{

    constructor(){
        super();
        this.serviceName = "SkillService";
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

    getAll() {
        return this.skills;
    };

    getSkillArray() {
        return this.skillArray;
    }
}

export default new SkillService();
