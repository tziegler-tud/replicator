import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";
import fetch from 'node-fetch';


let HttpRequest = new Skill({
    identifier: "HttpGetRequest",
    description: "Send a HTTP Request to a specified URL",
    variables: {
        method: Skill.variableTypes.connections.http.request_method,
        url: Skill.variableTypes.STRING,
        queryParams: Skill.variableTypes.STRING,
    },
    configuration: {
        parameters: [
            {identifier: "testString", type: "text", default: "test"},
            {identifier: "testNumber", type: "number", default: 1},
            {identifier: "testSelect", type: "select", default: "GET", options: [{label: "GET", value: "GET"}, {label: "Post", value:"POST"}]}
        ]
    },
    handler: async function({handlerArgs, configuration, intentHandler}){
        let config = {
            method: handlerArgs.method,
        }
        const url = handlerArgs.url + handlerArgs.queryParams;
        try {
            const response = await fetch(url, config);
            const body = await response.text();
            return body;
        }
        catch(e){
            return e
        }
    }
})

export default {HttpRequest}