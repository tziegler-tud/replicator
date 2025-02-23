import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";
import fetch from 'node-fetch';
import ClientService from "../../../services/ClientService.js";


let PlaySoundStreamSingle = new Skill({
    identifier: "PlaySoundStream-SingleClient",
    description: "Play a sound file from a remote source on a client",
    variables: {
        clientIds: Skill.variableTypes.client,
        source: Skill.variableTypes.STRING,
    },
    configuration: {
        parameters: [
            {identifier: "duration", title: "duration (sec)", type: "number", default: 0},
            {identifier: "delay", title: "delay (sec)", type: "number", default: 0},
        ]
    },
    handler: async function({handlerArgs, configuration}){

        const data = {
            command: "playAudioStream",
            source: handlerArgs.source,
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

export default {PlaySoundStreamSingle}