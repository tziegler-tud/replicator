import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";
import fetch from 'node-fetch';
import ClientService from "../../../services/ClientService.js";
import AudioService from "../../../services/AudioService.js";


let PlaySoundFileSingle = new Skill({
    identifier: "PlaySound-SingleClient",
    description: "Play a sound file on a client",
    variables: {
        clientId: Skill.variableTypes.client,
        filename: Skill.variableTypes.STRING,
    },
    configuration: {
        parameters: [
            {identifier: "duration", title: "duration (sec)", type: "number", default: 0},
            {identifier: "delay", title: "delay (sec)", type: "number", default: 0},
        ]
    },
    handler: async function({handlerArgs, configuration}){

        const source = AudioService.getFilePath(handlerArgs.filename);

        const data = {
            command: "playAudioStream",
            source: source,
            duration: configuration.duration,
            delay: configuration.delay,
        }
        if(handlerArgs.clientId) {
            const clientId = handlerArgs.clientId;
            const client  = await ClientService.getById(clientId);
            client.sendTcpWithResponse("action", data)
                .then(response => {

                })
                .catch(err => {

                })
        }
    }
})


let PlaySoundFileAll = new Skill({
    identifier: "PlaySound-AllClients",
    description: "Play a sound on all clients",
    variables: {
        filename: Skill.variableTypes.STRING,
    },
    configuration: {
        parameters: [
            {identifier: "duration", title: "duration (sec)", type: "number", default: 0},
            {identifier: "delay", title: "delay (sec)", type: "number", default: 0},
        ]
    },
    handler: async function({handlerArgs, configuration}) {

        const source = AudioService.getFilePath(handlerArgs.filename);

        const data = {
            command: "playAudioStream",
            source: source,
            duration: configuration.duration,
            delay: configuration.delay,
        }
        const clients = await ClientService.getAllClients();
        for (const client of clients) {
            client.sendTcpWithResponse("action", data)
                .then(response => {
                    console.log("Successfully played sound on Client " + client.identifier )
                })
                .catch(err => {
                    console.log("Failed to play sound on Client " + client.identifier + " Reason: " + err)
                })
        }
    }
})

export default {PlaySoundFileSingle, PlaySoundFileAll}