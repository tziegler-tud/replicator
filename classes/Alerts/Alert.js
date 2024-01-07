import mongoose from "mongoose";
import db from '../../schemes/mongo.js';
import SkillService from "../../services/SkillService.js";
const DbAlert = db.Alert;
import AlertExecutionContext from "../../classes/Alerts/AlertExecutionContext.js";
import Debug from "../../helpers/debug.js";

export default class Alert {
    constructor({identifier, name, type, priority=0, properties= {}}) {
        this.identifier = identifier;
        this.name = name;
        this.type = type;
        this.active = false;
        this.priority = priority;
        this.properties = properties;
        this.maxDuration = 0;
        this.phases = [
            {
                index: 0,
                initial: true,
                actions: [],
            }
        ]
        this.settings = {};
        this.activeExecutionContext = undefined;
    }

    _setState(state){
        if(state !== undefined){
            this.active = state;
            return this.active;
        }
        return undefined;
    }

    isActive(){
        return this.active;
    }

    attachExecutionContext(ec){
        this.activeExecutionContext = ec;
    }

    getActiveExecutionContext() {
        if(!this.isActive() || !this.activeExecutionContext){
            Debug.debug("Failed to get Execution Context: Alert not active.")
            return undefined;
        }
        return this.activeExecutionContext;
    }

    async loadFromDb(){
        const dbObject = await DbAlert.findOne({identifier: this.identifier}).lean();
        if(dbObject) {
            this.phases = dbObject.phases;
            this.settings = dbObject.settings;
            this.priority = dbObject.priority;
            this.properties = dbObject.properties;
            this.maxDuration = dbObject.maxDuration;
            return this;
        }
        else {
            await this.saveToDb();
            return this;
        }
    }

    async saveToDb(){
        const dbObject = await DbAlert.findOne({identifier: this.identifier});
        if(dbObject) {
            dbObject.phases = this.phases;
            dbObject.settings = this.settings;
            dbObject.properties = this.properties;
            dbObject.priority = this.priority;
            dbObject.maxDuration = this.maxDuration;
            dbObject.markModified("phases");
            dbObject.markModified("settings");
            dbObject.markModified("properties");
            await dbObject.save();
            return this;
        }
        else {
            const dbObject = new DbAlert({
                identifier: this.identifier,
                phases: this.phases,
                settings: this.settings,
                properties: this.properties,
                priority: this.priority,
                maxDuration: this.maxDuration,
            })
            await dbObject.save();
            return this;
        }
    }

    async removeFromDb(){
        const dbObject = await DbAlert.findOne({identifier: this.identifier});
        if(dbObject) {
            return DbAlert.findByIdAndRemove(dbObject.id);
        }
        else return false;
    }

    async update(data){
        const updateAbleSettings = {
            settings: data.settings,
            priority: data.priority,
            properties: data.properties,
            maxDuration: data.maxDuration,
        }

        const p = [];
        if(data.phaseSettings) {
            for(let entry of data.phaseSettings){
                if(entry.settings){
                    if(entry.settings.duration) {
                        await this.setPhaseDurationByIndex(entry.index, entry.settings.duration);
                    }
                }
            }
        }

        const updated = Object.assign(this, updateAbleSettings);
        Object.keys(updateAbleSettings).forEach(key => {
            this[key] = updated[key];
        })
        await this.saveToDb()
        return this;
    }

    async remove(){
        this.removeFromDb();
    }

    /**
     *
     * @param {Number} priority
     */
    async setPriority(priority){
        this.priority = priority;
        await this.saveToDb();
        return this.priority;
    }

    /**
     *
     * @param {Object} properties
     */
    async setProperties(properties= {}){
        this.properties = properties;
        await this.saveToDb();
        return this.properties;
    }

    getAllActions(){
        let actions = [];
        this.phases.forEach(phase => {
            actions = actions.concat(actions, phase.actions);
        })
        return actions;
    }

    /**
     *
     * @param action
     * @param phaseIndex
     * @returns {Promise<*>}
     */
    async addAction(action, phaseIndex) {

        //create id now
        var actionId = mongoose.Types.ObjectId();
        action._id = actionId;

        //create variables from skill
        const skill = SkillService.getSkillByIdentifier(action.skill.identifier);
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

        action.configuration = skill.configuration;

        const phase = this.getPhaseByIndex(phaseIndex)
        if(!phase) {
            let err = new Error("Failed to add action to alert phase: phaseIndex not found.")
            throw new Error(err);
        }
        else {
            action.phaseIndex = phase.index;
            phase.actions.push(action);
            await this.saveToDb();
            await this.loadFromDb(); //update variable ids
            return action;
        }
    }

    /**
     *
     * @param actionObjectId  {String} unique action identifier
     * @returns {Promise<*>}
     */
    async removeAction(actionObjectId) {
        let phaseActions = this.getAllActions();
        let index = phaseActions.findIndex(action => {
            return action._id.toString() === actionObjectId.toString()
        })
        if(index > -1) {
            const phase = this.getPhaseByIndex(phaseActions[index].phaseIndex);
            const indexInPhase = phase.actions.findIndex(action => action._id.toString() === actionObjectId.toString())
            if(indexInPhase > -1){
                phase.actions.splice(indexInPhase, 1);
                return await this.saveToDb();
            }
            else {
                let err = "Failed to remove action: Action is present, but was not found were it's supposed to be: phase with index " + phase.index;
                throw new Error(err);
            }
        }
        else throw new Error("Action not found.");
    }

    /**
     *
     * @param actionObjectId  {String} unique action identifier
     * @param actionData {Object} action object. overwrites previous content
     * @returns {Promise<*>}
     */
    async updateAction(actionObjectId, actionData) {
        let phaseActions = this.getAllActions();
        let index = phaseActions.findIndex(action => {
            return action._id.toString() === actionObjectId.toString()
        })
        if(index > -1) {
            const phase = this.getPhaseByIndex(phaseActions[index].phaseIndex);
            let actionIndex = phase.actions.findIndex(action => action._id.toString() === actionObjectId.toString());
            if(index > -1){
                actionData._id = phase.actions[actionIndex]._id;
                phase.actions[actionIndex] = actionData;
                return await this.saveToDb();
            }
            else {
                let err = "Failed to remove action: Action is present, but was not found were it's supposed to be: phase with index " + phase.index;
                throw new Error(err);
            }
        }
        else throw new Error("Action not found.");
    }

    async addPhase(){
        //get next index
        const index = this.getNextPhaseIndex();
        const phase = {index: index, duration: 2000, actions: []};
        this.phases.push(phase);
        return await this.saveToDb();
    }

    async removePhase(){
        this.phases.pop();
        return this.saveToDb();
    }

    async removePhaseByIndex(phaseIndex){
        const phase = this.getPhaseByIndex(phaseIndex);
        return this.removePhaseByObject(phase);
    }

    async removePhaseById(phaseId){
        const phase = this.getPhaseById(phaseId);
        return this.removePhaseByObject(phase);
    }

    async removePhaseByObject(phase){
        const errMsg = "Error: removePhase: ";
        if(!phase) throw new Error(errMsg + "Invalid argument");
        const index = this.getPhaseArrayIndex(phase);
        if(index > -1) {
            this.phases.splice(index, 1)
            return await this.saveToDb();
        }
        else {
            let err = new Error("Failed to remove alert phase: phaseIndex not found.")
            throw new Error(err);
        }
    }

    async setPhaseDurationByIndex(phaseIndex, ms){
        const phase = this.getPhaseByIndex(phaseIndex);
        return this.setPhaseDuration(phase, ms);
    }

    async setPhaseDurationById(phaseId, ms){
        const phase = this.getPhaseById(phaseId);
        return this.setPhaseDuration(phase, ms);
    }

    /**
     * set phase duration in ms
     * @param phase phase object
     * @param ms phase duration in milliseconds
     * @returns {Promise<void>}
     */
    async setPhaseDuration(phase, ms){
        //validate input
        const errMsg = "Error: setPhaseDuration: ";
        if(ms < 100) throw new Error(errMsg + "Invalid duration.")
        if(!phase) throw new Error(errMsg + "Invalid phase object received.");
        if(phase){
            phase.duration = ms;
            return this.saveToDb();
        }
        else throw new Error(errMsg + "Unknown PhaseId");
    }

    getPhaseById(phaseId){
        return this.phases.find(phase =>  phase._id.toString() === phaseId.toString());
    }

    getPhaseByIndex(phaseIndex){
        return this.phases.find(phase =>  parseInt(phase.index) === parseInt(phaseIndex))
    }

    getPhaseArrayIndex(phaseObject){
        return this.phases.findIndex(phase =>  phase._id.toString() === phaseObject._id.toString());

    }

    getNextPhaseIndex(){
        const indexArray = this.phases.map(phase => phase.index);
        return Math.max(...indexArray)+1;
    }
}