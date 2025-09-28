/**
 * @typedef SkillExecutionResult
 * @property {RUNRESULT} runResult
 * @property {String} skill Skill identifier
 * @property {Error} error
 */

export default class Skill {
    static variableTypes = {
        STRING: "string",
        NUMBER: "number",
        BOOLEAN: "boolean", //parses to bool. "false", "False" are interpreted as false, other values use js internal parsing
        PERCENT: "number", //removes % if string and parses to int
        ID: "string",
        OBJECT: "object",
        FUNCTION: "function",

        TEMPLATE: "template", //a string representation using {templating Syntax}

        light: "Light",
        lightGroup: "LightGroup",
        lightScene: "LightScene",

        client: "Client",

        Alerts: {
            Alerts: {
                alert_type: "alert_type",
            }
        },
        connections: {
            http: {
                request_method: "request_method",
            }
        }
    };

    static RUNRESULT = {
        SUCCESS: 0,
        FAILED: 1,
        TIMEOUT: 2,
        ABORTED: 3,
    }


    /**
     * @typedef SkillVariable
     * @property {String} identifier descriptive name, should be unique inside configuration object
     * @property {String} type Type of variable. can be "String" or "Number"
     * @property {String|Number} default Default value
     */

    /**
     * @typedef SkillConfigurationObject
     * @property {SkillVariable[]} variables
     */

    /**
     *
     * @param identifier {String} unique skill identifier
     * @param title {String} title displayed to humans
     * @param description {String} description displayed to humans
     * @param variables {Object} required variables and assigned type. Use static type enum
     * @param configuration {SkillConfigurationObject} configuration object
     * @param handler {Function} handler function. Receives the following arguments: handlerArgs, configuration, intentHandler. Can be async
     */
    constructor({identifier="Skill-"+Date.now(), title=identifier, description="No description available", variables={}, configuration={}, handler}={}) {

        this.identifier = identifier;
        this.description = description;
        this.variables = variables;
        this.configuration = configuration;
        if(handler) {
            this.handler = handler;
        }
        else {
            this.handler = function(){
                console.log("handler function not set.")
            }
        }
    }

    setHandlerFunction(func){
        this.handler = func;
    }

    /**
     *
     * @param handlerArgs
     * @param configuration {SkillConfigurationObject}
     * @param intentHandler {IntentHandler}
     * @returns {Promise<SkillExecutionResult>}
     */
    run({handlerArgs, configuration, intentHandler}){
        let self = this;
        return new Promise(function(resolve, reject){
            let err = undefined;
            //verify handler args
            for (const variableName in self.variables) {
                if(handlerArgs[variableName] === undefined){
                    //handlerArgs is missing variable!
                    const msg = "Failed to run skill: Missing argument " + variableName
                    err = new Error(msg);
                    break;
                }
                else {
                    //assert type
                    if(!(typeof(handlerArgs[variableName]) === self.variables[variableName])){
                        console.warn("Skill runner: Warning: Type missmatch: Expected " + variableName + " to be " + self.variables[variableName] + ", but found " + typeof(handlerArgs[variableName]))
                        //try parsing
                        handlerArgs[variableName] = self.parseVar(handlerArgs[variableName], self.variables[variableName])
                    }
                }
            }
            if(err){
                reject(err)
            }
            else {
                self.handler({
                    handlerArgs: handlerArgs,
                    configuration: configuration,
                    intentHandler: intentHandler
                })
                    .then(result => {
                        let skillExecutionResult = {
                            skill: self.identifier,
                            state: Skill.RUNRESULT.SUCCESS,
                            error: undefined,
                        }
                        resolve(skillExecutionResult);
                    })
                    .catch(err => {
                        const msg = "Failed to run skill: An error occured: " + err;
                        const e = new Error(msg);
                        let skillExecutionResult = {
                            skill: self.identifier,
                            state: Skill.RUNRESULT.FAILED,
                            error: e,
                        }
                        reject(SkillExecutionResult);
                    })
            }
        })
    }

    parseVar(variable, targetType){
        const type = typeof(variable);
        let parsed = variable;
        switch(targetType) {
            case Skill.variableTypes.BOOLEAN:
                parsed = !!variable;
                if(type === "string") {
                    parsed = (variable && variable !== "false" && variable !== "False");
                }
                break;
            case Skill.variableTypes.NUMBER:
                parsed = variable;
                if(type === "string") {
                    parsed = parseInt(variable);
                }
                break;
            case Skill.variableTypes.STRING:
                parsed = variable.toString();
                break;

            case Skill.variableTypes.PERCENT:
                if(type === "string") {
                    parsed = variable;
                    parsed.replace("%", "");
                    parsed = parseInt(parsed);
                }
                break;
            default:
                parsed = variable
                break;
        }

        return parsed;
    }
}