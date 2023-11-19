import { v4 as uuidv4 } from 'uuid';
import Debug from "../../helpers/debug.js"
import SettingsService from "../../services/SettingsService.js";
import SkillService from "../../services/SkillService.js";

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
    constructor(alert){
        this.id = uuidv4();
        this.alert = alert;
        this.state = ExecutionContext.STATE.INITIALIZED;
        this.endTime = undefined;
        this.terminated = true;
    }

    getAlert(){
        return this.alert;
    }

    /**
     *
     * @returns {Promise<unknown>}
     */
    run(){
        Debug.debug("Executing alert: " + this.alert.identifier);
        let self = this;
        this.state = ExecutionContext.STATE.RUNNING;
        this.currentAction = undefined;
        this.terminated = false;
        const forcedEndTime = Date.now() + 120000; //force end after 2 minutes
        let skillRunners = [];
        return new Promise((resolve, reject) => {
            const phases = this.alert.phases;
            //phases are run sequential until the ec is terminated.
            this.endTime = Math.min(Date.now() + parseInt(this.alert.maxDuration)*1000, forcedEndTime);
            Debug.debug("Starting alert execution. " + this.endTime ? "Automatic timeout at " + this.endTime : "No automatic timeout.");
            let currentPhase = getInitialPhase();

            while(!this.terminated && this.endTime > Date.now()) {

                currentPhase = getNextPhase(currentPhase);
            }

            const getInitialPhase = () => {

            }

            const getNextPhase = (currentPhase) => {

            }


        })
    }

    stop({reason}){
        Debug.debug("Alert " + this.alert.identifier + " stopped. Reason: " + reason, 2);

    }

}

class Phase {
    constructor({index, duration, actions}){
        this.index = index;
        this.actions = actions;
        this.duration = duration;

        this.runners = this.createRunners();
    }

    createRunners(){
        let runners = [];
        this.actions.forEach(action => {
            let runner = {};
            const skillIdentifier = action.skill.identifier;
            runner.config = action.config;
            runner.variables = action.variables;
            runner.skill = SkillService.getSkillByIdentifier(skillIdentifier);

            let handlerArgs = {};

            runner.variables.forEach(function(variable) {
                let result = undefined;
                switch(variable.mapping.mappingType) {
                    default:
                    case "constant":
                        if(variable.mapping.value.CONSTANT) {
                            result = variable.mapping.value.CONSTANT;
                        }
                        break;
                }
                handlerArgs[variable.name] = result;
            })

            runner.handlerArgs = handlerArgs;
            runners.push(runner);
        })

        return runners;
    }

    executeRunners(){
        return new Promise((resolve, reject) => {
            let promises = [];
            this.runners.forEach(runner => {
                const p = runner.skill.run({
                    handlerArgs: runner.handlerArgs,
                    configuration: runner.config,
                })
                promises.push(p);
            })
            Promise.all(promises)
                .then((result => {
                    resolve()
                }))
                .catch((err)=> {
                    reject(err);
                })
        })

    }

}