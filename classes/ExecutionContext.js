import { v4 as uuidv4 } from 'uuid';
import IntentHandlerService from "../services/IntentHandlerService.js";

export default class ExecutionContext {
    static STATE = {
        INITIALIZED: 0,
        RUNNING: 1,
        PAUSED: 2,
        FINISHING: 3,
        FINISHED: 4,
        STOPPED: 5,
        FAILED: 6,
    }
    constructor(intentHandler){
        this.id = uuidv4();
        this.intentHandler = intentHandler;
        this.state = ExecutionContext.STATE.INITIALIZED;
    }

    /**
     *
     * @param command {VoiceCommandObject}
     * @returns {Promise<unknown>}
     */
    run({command}){
        let self = this;
        this.state = ExecutionContext.STATE.RUNNING;
        this.currentAction = undefined;
        let skillRunners = [];
        return new Promise(function(resolve, reject){
            self.intentHandler.actions.forEach(function(action){
                self.currentAction = action;
                const skillIdentifier = action.skill.identifier;
                const config = action.config;

                //apply variable mappings
                const variables = action.variables;

                let handlerArgs = {};

                variables.forEach(function(variable) {
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
                    }
                    if (!result) {
                        //check if fallback is defined
                        result = variable.mapping.fallback;
                    }
                    handlerArgs[variable.name] = result;
                })

                //find skill
                let skill = IntentHandlerService.getSkillByIdentifier(skillIdentifier);
                let runner = skill.run({
                    handlerArgs: handlerArgs,
                    configuration: config,
                    intentHandler: self.intentHandler,
                })
                skillRunners.push(runner);
            })
            Promise.all(skillRunners)
                .then(results => {
                    //all skills run successfully.

                    //run finisher
                    self.state = ExecutionContext.STATE.FINISHING;
                    let finisherPromise = new Promise(function(resolve, reject){
                        if(self.intentHandler.finisher.active){
                            let finisherSkill = IntentHandlerService.getSkillByIdentifier(self.intentHandler.finisher.skill);
                            finisherSkill.run({
                                handlerArgs: args,
                                configuration: self.intentHandler.finisher.skill,
                                intentHandler: self.intentHandler,
                            })
                                .then(result => {
                                    resolve(result);
                                })
                        }
                        else resolve(undefined);
                    })

                    finisherPromise.then(finisherResult => {
                        //inform client that the execution context finished
                        self.state = ExecutionContext.STATE.FINISHED;
                        const result = {
                            id: self.id,
                            result: self.state,
                            finisher: finisherResult,
                        }
                        resolve(result);
                    })
                })
                .catch(err => {
                    //at least one skill failed to run
                    self.state = ExecutionContext.STATE.FAILED;
                    reject(err);
                })
        })
    }

    stop(){
        //check if running

    }

}