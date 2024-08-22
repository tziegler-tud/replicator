import Service from "./Service.js";
import {PicoLLM} from "@picovoice/picollm-node"

/**
 * @typedef SlotObject {Object}
 * @property {String} title
 * @property {String[]} values
 */

class PicovoiceLLMService extends Service{
    constructor(){
        super();
        this.accessKey = undefined;
        this.modelPath = undefined;
        this.pllmOptions = undefined;
        this.pllm = undefined;
        this.debugLabel = "PicovoiceLLMService: ";
    }

    initFunc({accessKey, modelPath}={}){
        this.accessKey = accessKey;
        this.modelPath = modelPath;
        return new Promise((resolve, reject)=>{
            /**
             *
             * @type PicoLLMInitOptions
             */
            let options = {device: "cpu"}
            const devices = PicoLLM.listAvailableDevices();
            /**
             * @type PicoLLM
             */
            try {
                this.pllm = new PicoLLM(
                    this.accessKey,
                    this.modelPath,
                    {device: "cpu"}
                );
            }
            catch(e){
                console.error(e)
            }

            resolve();
        })
    }

    generateAnswer(prompt, options={}){
        /**
         * @type PicoLLMCompletion
         */
        try{
            console.log("Trying to generate answer to prompt: " + prompt)
            let llmCompletion = this.pllm.generate(prompt);
            return llmCompletion.completion;
        }
        catch(e){
            console.error("Failed to generate answer: " + e);
        }
    }

}
export default new PicovoiceLLMService()