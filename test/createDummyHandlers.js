import IntentHandlerService from "../services/IntentHandlerService.js";
import ClientService from "../services/ClientService.js";
import IntentService from "../services/IntentService.js";
import {VariableExpectation} from "../helpers/enums.js";


export default async function createIntentHandlers(amount){

    await ClientService.init;
    await IntentService.init;

    const intents = IntentService.getAllIntents();


    for (let i=0; i<amount; i++){
        let testClient;
        let clients = await ClientService.getAllClients()
        if (clients.length > 0) {
            testClient = getRandomElement(clients);
        }

        function getRandomElement(array) {
            if(array.length < 1 || !Array.isArray(array)) return undefined;
            return array[Math.floor(Math.random() * (array.length-1))];
        }

        let testIntent = getRandomElement(intents);

        //delete if exists
        const identifier = "TestIntentHandler"+i;

        const handler = await IntentHandlerService.getByIdentifier(identifier);
        if(handler) {
            await IntentHandlerService.delete(identifier);
        }


        let ih1 = {
            identifier: identifier,
            clients: [testClient.dbId],
            intent: testIntent.identifier,
            variables: {
                required: {
                    requiredVar1: "String",
                },
                optional: {
                    optionalVar1: "String",
                },
                forbidden: {
                    forbiddenVar1: "String",
                }
            }
        }
        let result = await IntentHandlerService.create(ih1);
        await result.addVariable("requiredVar2", "String", VariableExpectation.REQUIRED);

        const skills = IntentHandlerService.getSkills();
        const skillArray = IntentHandlerService.getSkillArray();

        const skill = getRandomElement(skillArray);

        let action = {
            skill: {
                identifier: skill.identifier,
            },
            config: {
                arguments: {
                    testArg: "testArg",
                }
            }
        }
        await IntentHandlerService.addAction(identifier, action);
    }
}