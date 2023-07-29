import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";

/**
 * changes the state of a single Light
 */

let LightStateOn = new Skill({
    identifier: "LightStateOn",
    description: "Turn a light on",
    variables: {
        lightId: Skill.variableTypes.light,
    },
    handler: async function({handlerArgs, configuration, intentHandler}){
        let light = await LightsService.getLightByUniqueId(handlerArgs.lightId);
        light.on();
    }
})

let LightStateOff = new Skill({
    identifier: "LightStateOff",
    description: "Turn a light off",
    variables: {
        lightId: Skill.variableTypes.light,
    },
    handler: async function({handlerArgs, configuration, intentHandler}){
        let light = await LightsService.getLightByUniqueId(handlerArgs.lightId);
        light.off();
    }
})

let LightStateToggle = new Skill({
    identifier: "LightStateToggle",
    description: "Toggle the state of a light.",
    variables: {
        lightId: Skill.variableTypes.light,
    },
    handler: async function({handlerArgs, configuration, intentHandler}){
        let light = await LightsService.getLightByUniqueId(handlerArgs.lightId);
        return await light.toggle();
    }
})


let LightStateSet = new Skill({
    identifier: "LightStateSet",
    description: "Explicitly set the state of a light, or use to toggle.",
    variables: {
        lightId: Skill.variableTypes.light,
        state: Skill.variableTypes.STRING,
    },
    handler: async function({handlerArgs, configuration, intentHandler}){
        let light = await LightsService.getLightByUniqueId(handlerArgs.lightId);
        switch(handlerArgs.state) {
            case "on":
                return await light.on();
            case "off":
                return await light.off();
            default:
                return await light.toggle();
        }
    }
})
export default {LightStateOn, LightStateOff, LightStateToggle, LightStateSet}