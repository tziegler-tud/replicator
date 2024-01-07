import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";

/**
 * changes the state of a single Light
 */

let LightGroupStateOn = new Skill({
    identifier: "LightGroupStateOn",
    description: "Turn a LightGroup on",
    variables: {
        groupId: Skill.variableTypes.lightGroup,
    },
    handler: async function({handlerArgs, configuration}){
        let light = await LightsService.getGroupByUniqueId(handlerArgs.groupId);
        light.on();
    }
})

let LightGroupStateOff = new Skill({
    identifier: "LightGroupStateOff",
    description: "Turn a LightGroup off",
    variables: {
        groupId: Skill.variableTypes.lightGroup,
    },
    handler: async function({handlerArgs, configuration}){
        let light = await LightsService.getGroupByUniqueId(handlerArgs.groupId);
        light.off();
    }
})

let LightGroupStateToggle = new Skill({
    identifier: "LightGroupStateToggle",
    description: "Toggle the state of a light.",
    variables: {
        groupId: Skill.variableTypes.lightGroup,
    },
    handler: async function({handlerArgs, configuration}){
        let light = await LightsService.getGroupByUniqueId(handlerArgs.groupId);
        light.toggle();
    }
})

let LightGroupStateSet = new Skill({
    identifier: "LightGroupStateSet",
    description: "Explicitly set the state of a lightgroup, or use to toggle.",
    variables: {
        groupId: Skill.variableTypes.lightGroup,
        state: Skill.variableTypes.STRING,
    },
    handler: async function({handlerArgs, configuration}){
        let light = await LightsService.getGroupByUniqueId(handlerArgs.groupId);
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

export default {LightGroupStateOn, LightGroupStateOff, LightGroupStateToggle, LightGroupStateSet}