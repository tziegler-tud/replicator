import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";
import fetch from 'node-fetch';
import ClientService from "../../../services/ClientService.js";


let PlayTTSOnClient = new Skill({
    identifier: "PlayTTS-SingleClient",
    description: "Text-to-speech output on a single client",
    variables: {
        clientIds: Skill.variableTypes.client,
        text: Skill.variableTypes.STRING,
    },
    configuration: {
        parameters: [
            {identifier: "duration", title: "duration (sec)", type: "number", default: 0},
            {identifier: "delay", title: "delay (sec)", type: "number", default: 0},
        ]
    },
    handler: async function({handlerArgs, configuration}){

        const data = {
            command: "playSoundLocal",
            filename: handlerArgs.filename,
            duration: configuration.duration,
            delay: configuration.delay,
        }
        //this was intended to handle multiple clients, but input mapping does not support this right now
        if(handlerArgs.clientIds) {
            const clientId = handlerArgs.clientIds;
            const client  = await ClientService.getById(clientId);
            client.sendTcpWithResponse("action", data)
                .then(response => {

                })
                .catch(err => {

                })
        }
    }
})

export default {PlayTTSOnClient}