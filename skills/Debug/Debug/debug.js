import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";
import fetch from 'node-fetch';
import Debug from "../../../helpers/debug.js";


let debugMessage = new Skill({
    identifier: "Debugging Message",
    description: "Create a debugging message",
    variables: {
        message: Skill.variableTypes.STRING,

    },
    configuration: {
        parameters: [
            {identifier: "level", text: "Debugging level", type: "number", default: "1"},
        ]
    },
    handler: async function({handlerArgs, configuration}){
        Debug.debug(handlerArgs.message, 1);
    }
})

export default {debugMessage}