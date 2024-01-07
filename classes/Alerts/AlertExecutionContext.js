import { v4 as uuidv4 } from 'uuid';
import Debug from "../../helpers/debug.js"
import SettingsService from "../../services/SettingsService.js";
import SkillService from "../../services/SkillService.js";


/**
 * @typedef {Object} Alert
 * @property {String} identifier
 * @property {Number} priority
 * @property {Number} maxDuration
 * @property {Object} properties
 * @property {AlertPhase[]} phases
 */

/**
 * @typedef {Object} AlertPhase
 * @property {Number} index
 * @property {Boolean} initial
 * @property {Number} duration
 * @property {Object[]} actions
 */
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
        /**
         * @type Alert
         */
        this.alert = alert;
        this.state = ExecutionContext.STATE.INITIALIZED;
        this.endTime = undefined;
        this.terminated = true;
        this.lastTerminationReason = "unknown";
    }

    getAlert(){
        return this.alert;
    }

    /**
     *
     * @returns {Promise<unknown>}
     */
    async run(){
        Debug.debug("Executing alert: " + this.alert.identifier);
        this.lastTerminationReason = "unknown";
        let self = this;
        this.state = ExecutionContext.STATE.RUNNING;
        this.currentAction = undefined;
        this.terminated = false;
        const forcedEndTime = Date.now() + 120000; //force end after 2 minutes
        let skillRunners = [];

        const phases = [];
        this.alert.phases.forEach(phase => {
            console.log(phase.index)
            phases.push(new Phase({index: phase.index, duration: phase.duration, actions: phase.actions, initial: phase.initial}))
        })
        this.phases = phases;
        this.nonInitialPhases = phases.filter(phase => {
            return !phase.initial;
        })
        this.availablePhaseIndexes = this.nonInitialPhases.map(phase => {
            return phase.index;
        })
        this.availablePhaseIndexes.sort((a,b) => a-b);
        //phases are run sequential until the ec is terminated.
        this.endTime = this.alert.maxDuration > 0 ? Math.min(Date.now() + parseInt(this.alert.maxDuration)*1000, forcedEndTime) : forcedEndTime;
        Debug.debug("Starting alert execution. Automatic timeout at " + this.endTime);
        const timeout = this.endTime - Date.now();
        setTimeout(() => {
            this.terminated = true;
            if(this.state === ExecutionContext.STATE.RUNNING){
                this.stop({reason: "Automatic timeout."});
                this.state = ExecutionContext.STATE.FINISHED;
            }
        }, timeout)
        let currentPhase = this.getInitialPhase();

        while(!this.terminated && this.endTime > Date.now()) {
            await this.runPhase(currentPhase);
            currentPhase = this.getNextPhase(currentPhase)
        }

        return {finished: true, successful: true, state: this.state, reason: this.lastTerminationReason};
    }



    stop({reason}){
        if(this.state === ExecutionContext.STATE.RUNNING) {
            this.state = ExecutionContext.STATE.STOPPED;
            this.terminated = true;
            this.lastTerminationReason = reason;
            Debug.debug("Alert " + this.alert.identifier + " stopped. Reason: " + reason, 2);
        }
    }

    runPhase = (currentPhase) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const currentPhaseTimeout = startTime + currentPhase.duration;
            let elapsed = 0
            currentPhase.executeRunners()
                .then(result => {
                    //await phase duration timeout
                    elapsed = Date.now() - startTime;
                    const remainingMs = currentPhase.duration - elapsed;
                    Debug.debug("Remaining timeout: "  + remainingMs,2)
                    if(remainingMs > 0){
                        setTimeout(()=>resolve(), remainingMs)
                    }
                    else {
                        resolve();
                    }
                })
                .catch(err => {
                    reject(err);
                })
        })

    }

    getInitialPhase = () => {
        return this.phases.find(phase => phase.initial);
    }

    getNextPhase = (currentPhase) => {
        const currentIndex = currentPhase.index;
        const nextIndex = this.availablePhaseIndexes.includes(currentIndex+1) ? currentIndex+1 : this.availablePhaseIndexes[0];
        return this.nonInitialPhases.find(phase => phase.index === nextIndex);
    }

}

class Phase {
    constructor({index, duration, actions, initial}){
        this.index = index;
        this.actions = actions;
        this.duration = duration;
        this.initial = initial;

        this.runners = this.createRunners();
    }

    createRunners(){
        let runners = [];
        this.actions.forEach(action => {
            let runner = {};
            const skillIdentifier = action.skill.identifier;
            runner.config = action.configuration;
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