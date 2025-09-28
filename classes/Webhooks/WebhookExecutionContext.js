import { v4 as uuidv4 } from 'uuid';
import Debug from "../../helpers/debug.js"
import SettingsService from "../../services/SettingsService.js";
import SkillService from "../../services/SkillService.js";
import LightsService from "../../services/LightsService.js";

export default class WebhookExecutionContext {
    static STATE = {
        INITIALIZED: 0,
        RUNNING: 1,
        PAUSED: 2,
        FINISHING: 3,
        FINISHED: 4,
        STOPPED: 5,
        FAILED: 6,
    }
    constructor(alert){
        this.id = uuidv4();
        /**
         * @type Alert
         */
        // this.alert = alert;
        this.identifier = alert.identifier;
        this.restoreLightState = alert.restoreLightState;
        this.state = WebhookExecutionContext.STATE.INITIALIZED;
        this.runners = [];
        this.actions = [];
        this.finisher = undefined;

    }

    getIdentifier(){
        return this.identifier;
    }

    /**
     *
     * @param command {VoiceCommandObject}
     * @returns {Promise<unknown>}
     */
    run({command}){
        Debug.debug("Executing Webhook: " + this.identifier);
        this.state = WebhookExecutionContext.STATE.RUNNING;
        this.currentAction = undefined;
        let skillRunners = [];
        return new Promise((resolve, reject) => {
            this.actions.forEach(function(action){
                action = action.toJSON();
                this.currentAction = action;
                const skillIdentifier = action.skill.identifier;
                let config = {}
                for (const param of action.configuration.parameters){
                    config[param.identifier] = param.value ?? param.default;
                }

                //apply variable mappings
                const variables = action.variables;

                let handlerArgs = {};

                Debug.debug("Running skill: " + skillIdentifier);

                variables.forEach((variable) =>{
                    let result = undefined;
                    let slot = undefined;
                    switch(variable.mapping.mappingType) {
                        case "constant":
                            if(variable.mapping.value.CONSTANT) {
                                result = variable.mapping.value.CONSTANT;
                            }
                            else {
                                result = undefined
                            }
                            break;

                        case "variable":
                            slot = command.slots[variable.mapping.variable];
                            if(slot) {
                                result = slot
                            }
                            break;
                        case "dynamicVariable":
                            slot = command.slots[variable.mapping.variable];
                            if(slot) {
                                result = variable.mapping.value[slot];
                            }
                            else {

                            }
                            break;
                        case "property":
                            if(variable.mapping.variable === undefined) {
                                result = undefined;
                            }
                            else {
                                let property = this.properties.find(property => property.key === variable.mapping.variable);
                                result = property ? property.value : undefined;
                            }
                            break;
                        case "dynamicProperty":
                            if(variable.mapping.variable === undefined) {
                                result = undefined;
                            }
                            else {
                                let property = this.properties.find(property => property.key === variable.mapping.variable);
                                if(property) {
                                    result = variable.mapping.value[property.value];
                                }
                            }
                            break;
                    }
                    if (!result) {
                        //check if fallback is defined
                        result = variable.mapping.fallback;
                    }
                    handlerArgs[variable.name] = result;
                })

                //find skill
                let skill = SkillService.getSkillByIdentifier(skillIdentifier);
                let runner = skill.run({
                    handlerArgs: handlerArgs,
                    configuration: config,
                })
                skillRunners.push(runner);
            })
            Promise.all(skillRunners)
                .then(results => {
                    //all skills run successfully.

                    //run finisher
                    this.state = WebhookExecutionContext.STATE.FINISHING;
                    let finisherPromise = new Promise((resolve, reject) => {
                        if(this.finisher.active){
                            let finisherSkill = SkillService.getSkillByIdentifier(this.finisher.skill);
                            finisherSkill.run({
                                handlerArgs: args,
                                configuration: this.finisher.skill,
                            })
                                .then(result => {
                                    resolve(result);
                                })
                        }
                        else resolve(undefined);
                    })

                    finisherPromise.then(finisherResult => {
                        //inform client that the execution context finished
                        this.state = WebhookExecutionContext.STATE.FINISHED;
                        const result = {
                            id: this.id,
                            result: this.state,
                            finisher: finisherResult,
                        }
                        resolve(result);
                    })
                })
                .catch(err => {
                    //at least one skill failed to run
                    this.state = WebhookExecutionContext.STATE.FAILED;
                    reject(err);
                })
        })
    }

}