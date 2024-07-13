import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";
import fetch from 'node-fetch';
import ClientService from "../../../services/ClientService.js";


export let PlaySoundFileLocal = new Skill({
    identifier: "Client_PlaySoundFileLocal",
    description: "Play a sound file on a client",
    variables: {
        clientIds: Skill.variableTypes.client,
        filename: Skill.variableTypes.STRING,
    },
    configuration: {
        parameters: [
            {identifier: "testString", type: "text", default: "test"},
            {identifier: "testNumber", type: "number", default: 1},
            {identifier: "testSelect", type: "select", default: "GET", options: [{label: "GET", value: "GET"}, {label: "Post", value:"POST"}]}
        ]
    },
    handler: async function({handlerArgs, configuration}){

        const data = {
            command: "playSoundLocal",
            filename: handlerArgs.filename,
        }
        for (const clientId of handlerArgs.clients){
            const client  = await ClientService.getById(clientId);
            client.sendTcpWithResponse("action", data)
                .then(response => {

                })
                .catch(err => {

                })
        }
    }
})