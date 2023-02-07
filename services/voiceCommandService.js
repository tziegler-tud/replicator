//this class takes the voice command object from picovoice and processes it
import Service from "./Service.js";
import IntentService from "./IntentService.js";

/**
 * @typedef VoiceCommandObject
 * @property isUnderstood {Boolean} true if the command was understood
 * @property intent {String} intend class descriptor
 * @property slots {Object} dynamic object containing the variables defined by the rhino model. Check model description for docs
 */

class VoiceCommandService extends Service {
    constructor(args={}, init=false){
        super();
        let self = this;
        this.args = args;
        this.mutex = false;

        return this;
    }

    initFunc(args) {
        let self = this;
        return new Promise(function(resolve, reject){
            console.log("Initializing VoiceCommandService...");
            resolve();
        })
    }

    /**
     *
     * @param client {Client}
     * @param command {VoiceCommandObject}
     * @param emitter {Emitter}
     * @param args {Object}
     */
    processClientCommand(client, command, emitter, args) {
        let self = this;
        this.init.then(function(){
            //check if understood
            if (!command.isUnderstood) {
                //not understood. nothing we can do
                //this should not even got send by the client, but you know how clients are. Just ignore it.
                return false;
            } else {
                //get intent
                let title = command.intent;
                //retrieve matching intent
                let intent = IntentService.getIntent(title);
                //determine which variables are set
                //first, retrieve intent variables
                let intentVariables = intent.variables;
                //these are the variables we can expect. now, lets check which ones we have:
                let commandVariables = command.slots; //is an object, the keys are variable names
                //now, let the intent check its handlers. It returns an array. If its empty, no handlers qualified
                let matchingHandlers = intent.checkHandlers(command.slots);
                if (matchingHandlers.length > 0) {
                    //it's a match!
                    //run the handlers
                    matchingHandlers.forEach(function (handler) {
                        handler.run(command.slots, location)
                    })
                    // if(location.ledInterface.isActive) {
                    //     location.ledInterface.play("success")
                    //         .then(function(){
                    //             location.ledInterface.play("ready")
                    //         })
                    // }

                } else {
                    //no handler found
                    // if(location.ledInterface.isActive) {
                    //     location.ledInterface.play("failed")
                    //         .then(function(){
                    //             location.ledInterface.play("ready")
                    //         })
                    // }
                }
            }
        })
        .catch(err=> {
            console.log("VoiceCommandService not initialized.");
        })
    }
}

export default new VoiceCommandService();