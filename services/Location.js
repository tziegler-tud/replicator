const { Picovoice } = require("@picovoice/picovoice-node");
const PvRecorder = require("@picovoice/pvrecorder-node");

// const picoVoiceConfig = require("../config/picovoice2.json");
const picoVoiceConfig = require("../config/picovoice-pi.json");
const VoiceCommandService = require("./voiceCommandService");
const LedInterface = require("./LedInterface.js");

const LightsService = require("./LightsService");
const {Porcupine} = require("@picovoice/porcupine-node");
const {Rhino} = require("@picovoice/rhino-node");
const lightsService = LightsService.getInstance();

/**
 * @typedef {Object} LightGroupObject
 * @property {Integer} id  light id as assigned by hue bridge
 * @property {string} name  group name as assigned by hue bridge.
 */

/**
 * Location class
 * @class
 * @constructor
 * @alias Location_
 *
 * @property {LightGroupObject[]} lightGroups
 */
class Location {
    /**
     *
     * @param identifier {string}
     */
    constructor(identifier){
        let self = this;
        this.recorderDeviceIndex = undefined;
        this.identifier = identifier;
        this.recorder = undefined;
        this.voiceCommandService = VoiceCommandService.getInstance();
        this.picoVoiceConfig = picoVoiceConfig;
        this.ledInterface = {};

        /** @type {LightGroupObject[]} */
        this.lightGroups = [];
        this.lights = [];
    }

    addLedInterface(ledAmount){
        let self = this;
        this.ledInterface = new LedInterface(ledAmount);
        this.ledInterface.init
            .then(ledIf=> {
                console.log("LED interface set up for Location: " + self.identifier);

            })
            .catch(err => {
                console.warn(err);
            })

    }


    addRecorder(recorderDeviceIndex) {
        let self = this;
        if(recorderDeviceIndex === undefined) {
            recorderDeviceIndex = -1;
        }
        this.keywordCallback = function (keyword) {
            console.log(`wake word detected for location: ` + self.identifier);
            self.voiceCommandService.processKeyword(keyword, self);
        };

        this.inferenceCallback = function (inference) {
            console.log("bind test: " + self.identifier)
            console.log("Inference:");
            console.log(JSON.stringify(inference, null, 4));

            //we have detected a voice command. Forward to command handler
            self.voiceCommandService.processCommand(inference, self);

        };
        // initalize new picovoice rt-obj
        // this.picovoice= new Picovoice(
        //     self.picoVoiceConfig.accessKey,
        //     self.picoVoiceConfig.keywordArgument,
        //     keywordCallback,
        //     self.picoVoiceConfig.contextPath,
        //     inferenceCallback,
        //     self.picoVoiceConfig.porcupineSensitivity,
        // );
        this.porcupine = new Porcupine(
            self.picoVoiceConfig.accessKey,
            self.picoVoiceConfig.keywordArgument,
            self.picoVoiceConfig.porcupineSensitivity,
        );

        this.rhino = new Rhino(
            self.picoVoiceConfig.accessKey,
            self.picoVoiceConfig.contextPath,
            0.5,
        );
        this._frameLength = 512;
        this._sampleRate = 16000;
        this._version = "2.1.0";

        this._porcupineVersion = this.porcupine.version;
        this._rhinoVersion = this.rhino.version;
        this._contextInfo = this.rhino.getContextInfo();

        this.isWakeWordDetected = false;
        this.recorder = new PvRecorder(recorderDeviceIndex, this._frameLength);
    }

    start() {
        let self = this;
        async function startRecorder() {
            self.recorder.start();
            console.log("Listening for 'COMPUTER' in " + self.identifier + "...");
            if(self.ledInterface.isActive){
                self.ledInterface.play("setupComplete", {amount: 1})
                    .then(function(){
                        self.ledInterface.play("ready")
                    })
            }
            while (1) {
                const frame = await self.recorder.read();
                if (self.porcupine === null || self.rhino === null) {
                    throw new Error(
                        "Attempting to process but resources have been released."
                    );
                }
                if (!self.isWakeWordDetected) {
                    const keywordIndex = self.porcupine.process(frame);

                    if (keywordIndex !== -1) {
                        self.isWakeWordDetected = true;
                        self.keywordCallback(keywordIndex);
                    }
                } else {
                    const isFinalized = self.rhino.process(frame);

                    if (isFinalized) {
                        self.isWakeWordDetected = false;
                        self.inferenceCallback(self.rhino.getInference());
                    }
                }
            }
        }
        if(self.recorder){
            startRecorder()
                .then(result => {
                    console.log("running");
                })
                .catch(e=> {
                    console.error(e);
                })
        }
        else {
            console.error("Failed to start recorder for location "+ self.identifier +": Recorder not initialized.");
        }
    };
    stop() {
        this.recorder.stop();
    };

    /**
     * adds a hue light group
     * @param groupName {string} name of the group assigned by the hue bridge.
     */
    addLightGroup(groupName) {
        lightsService.getLightGroupIdByName(groupName)
            .then(id => {
                let o = {id: id, name: groupName};
                this.lightGroups.push(o);
                return o;
            })
            .catch(e => {
                return false
            });
    }

    addLight(lightName, aliases) {
        lightsService.getLightIdByName(lightName)
            .then(id => {
                let o = {id: id, name: lightName, aliases: aliases};
                this.lights.push(o);
                return o;
            })
            .catch(e => {
                return false
            });
    }

    getLightsByAlias(alias){
        return this.lights.filter(light => light.aliases.includes(alias));
    }
}

module.exports = Location;