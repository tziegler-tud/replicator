import Skill from "../../skill.js";
import TtsService from "../../../services/TtsService.js";
import ClientService from "../../../services/ClientService.js";

let PlayTTSOnClient = new Skill({
    identifier: "PlayTTS-SingleClient",
    description: "Text-to-speech output on a single client",
    variables: {
        clientId: Skill.variableTypes.client,
        text: Skill.variableTypes.TEMPLATE,
    },
    configuration: {
        parameters: [
            {identifier: "duration", title: "duration (sec)", type: "number", default: 0},
            {identifier: "delay", title: "delay (sec)", type: "number", default: 0},
        ]
    },
    handler: async function({handlerArgs, configuration}){

        const content = await TtsService.resolveTemplate(handlerArgs.text);
        //create audio file
        const filename = await TtsService.getAudio(content)
        const source = TtsService.getFileUrl(filename);

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

export default {PlayTTSOnClient}