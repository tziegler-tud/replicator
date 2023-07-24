import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";


let HttpRequest = new Skill({
    identifier: "HttpGetRequest",
    description: "Send a HTTP Request to a specified URL",
    variables: {
        method: Skill.variableTypes.connections.http.request_method,
        url: Skill.variableTypes.STRING,
    },
    configuration: {
        parameters: [
            {identifier: "testString", type: "String", default: "test"},
            {identifier: "testNumber", type: "Number", default: 1}
        ]
    },
    handler: async function({handlerArgs, configuration, intentHandler}){
        let config = {
            method: handlerArgs.method,
        }
        try {
            const response = await fetch(handlerArgs.url, config);
            const body = await response.text();
            return body;
        }
        catch(e){
            return e
        }
    }
})

export default {HttpRequest}