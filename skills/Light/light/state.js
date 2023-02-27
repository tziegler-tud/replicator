import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";

/**
 * changes the state of a single Light
 */

let LightStateOn = new Skill({
    identifier: "LightStateOn",
    description: "Turn a light on",
    variables: {
        lightId: Skill.variableTypes.STRING,
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
        lightId: Skill.variableTypes.STRING,
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
        lightId: Skill.variableTypes.STRING,
    },
    handler: async function({handlerArgs, configuration, intentHandler}){
        let light = await LightsService.getLightByUniqueId(handlerArgs.lightId);
        return await light.toggle();
    }
})

export default {LightStateOn, LightStateOff, LightStateToggle}