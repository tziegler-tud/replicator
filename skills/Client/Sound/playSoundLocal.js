import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";
import fetch from 'node-fetch';
import ClientService from "../../../services/ClientService.js";


let PlaySoundFileLocalSingle = new Skill({
    identifier: "PlayLocalSound-SingleClient",
    description: "Play a sound file on a client",
    variables: {
        clientIds: Skill.variableTypes.client,
        filename: Skill.variableTypes.STRING,
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


let PlaySoundFileLocalAll = new Skill({
    identifier: "PlayLocalSound-AllClients",
    description: "Play a local sound file on all clients",
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
        const data = {
            command: "playSoundLocal",
            filename: handlerArgs.filename,
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

export default {PlaySoundFileLocalSingle, PlaySoundFileLocalAll}