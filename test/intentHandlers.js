import IntentHandlerService from "../services/IntentHandlerService.js";
import ClientService from "../services/ClientService.js";
import IntentService from "../services/IntentService.js";
import {VariableExpectation} from "../helpers/enums.js";


export default async function createIntentHandler(){

    await ClientService.init;
    await IntentService.init;



    let testClient;
    let clients = await ClientService.getAllClients()
    if (clients.length > 0) {
        testClient = clients[0];
    }

    let testIntent = IntentService.getAllIntents()[0];

    //delete if exists
    const identifier = "TestIntentHandler";

    const handler = await IntentHandlerService.getByIdentifier(identifier);
    if(handler) {
        await IntentHandlerService.delete(identifier);
    }


    let ih1 = {
        identifier: identifier,
        client: testClient.dbId,
        intent: testIntent.dbObject,
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

    // let action = {
    //     skill: {
    //         identifier: skills.Light.light.state.LightStateOn.identifier,
    //     },
    //     config: {
    //         arguments: {
    //             testArg: "testArg",
    //         }
    //     }
    // }
    // result.addAction(action)
    // await result.save();
    let action2 = {
        skill: {
            identifier: skills.Light.light.state.LightStateToggle.identifier,
        },
        config: {
            arguments: {

            }
        }
    }
    await IntentHandlerService.addAction(identifier, action2);
    const handlerResult = await IntentHandlerService.run(identifier, {
        lightId: "58d2de6c-51ff-4869-a51e-21b4b50524e7",
        requiredVar1: "test",
        requiredVar2: "test2"
    })
    console.log(handlerResult);

}