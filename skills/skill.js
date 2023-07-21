export default class Skill {
    static variableTypes = {
        STRING: "string",
        NUMBER: "Number",
        PERCENT: "string",
        ID: "string",
        OBJECT: "object",
        FUNCTION: "function",

        light: "Light",
        lightGroup: "LightGroup",
        lightScene: "LightScene",

        connections: {
            http: {
                request_method: "request_method",
            }
        }
    };

    /**
     *
     * @param identifier {String} unique skill identifier
     * @param title {String} title displayed to humans
     * @param description {String} description displayed to humans
     * @param variables {Object} required variables and assigned type. Use static type enum
     * @param handler {Function} handler function. Receives the following arguments: handlerArgs, configuration, intentHandler. Can be async
     */
    constructor({identifier="Skill-"+Date.now(), title=identifier, description="No description available", variables={}, handler}={}) {
        this.identifier = identifier;
        this.description = description;
        this.variables = variables;
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
                    if(!typeof(handlerArgs[variableName]) === self.variables[variableName]){
                        console.warn("Skill runner: Warning: Type missmatch: Expected " + variableName + " to be " + self.variables[variableName] + ", but found " + typeof(handlerArgs[variableName]))
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
                        resolve(result);
                    })
                    .catch(err => {
                        const msg = "Failed to run skill: An error occured: " + err;
                        const e = new Error(msg);
                        reject(e);
                    })
            }
        })
    }
}