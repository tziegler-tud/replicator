import IntentHandlerService from "../services/IntentHandlerService.js";
import ClientService from "../services/ClientService.js";
import IntentService from "../services/IntentService.js";
import {VariableExpectation} from "../helpers/enums.js";
import SkillService from "../services/SkillService.js";


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

    const skills = SkillService.getAll();

    let action = {
        skill: {
            identifier: skills.Light.lightGroup.state.LightGroupStateToggle.identifier,
        },
        config: {
            arguments: {
                testArg: "testArg",
            }
        }
    }
    let action2 = {
        skill: {
            identifier: skills.Light.light.state.LightStateToggle.identifier,
        },
        config: {
            arguments: {

            }
        }
    }
    await IntentHandlerService.addAction(identifier, action);
    // await IntentHandlerService.addAction(identifier, action2);
    // const ec = await IntentHandlerService.createExecutionContext(identifier)
    // const handlerResult = await ec.run({
    //     // lightId: "58d2de6c-51ff-4869-a51e-21b4b50524e7",
    //     groupId: "99b989a4-3576-4715-a774-7fa408b612ff",
    //     requiredVar1: "test",
    //     requiredVar2: "test2"
    // })
    // console.log(handlerResult);

}