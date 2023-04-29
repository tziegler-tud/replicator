import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";

/**
 * changes the state of a single Light
 */

let setLightGroupBrightnessAbsolute = new Skill({
    identifier: "setLightGroupBrightnessAbsolute",
    title: "Brightness - Absolute",
    description: "Set the brightness to a specific value",
    variables: {
        groupId: Skill.variableTypes.lightGroup,
        percentValue: Skill.variableTypes.PERCENT,
    },
    handler: async function({handlerArgs, configuration, intentHandler}){
        let light = await LightsService.getGroupByUniqueId(handlerArgs.groupId);
        light.setBrightness({percentValue: handlerArgs.percentValue, isRelative: false})
    }
})

let setLightGroupBrightnessRelative = new Skill({
    identifier: "setLightGroupBrightnessRelative",
    title: "Brightness - Relative",
    description: "Increase or decrease current brightness",
    variables: {
        groupId: Skill.variableTypes.lightGroup,
        percentValue: Skill.variableTypes.PERCENT,
    },
    handler: async function({handlerArgs, configuration, intentHandler}){
        let light = await LightsService.getGroupByUniqueId(handlerArgs.groupId);
        light.setBrightness({percentValue: handlerArgs.percentValue, isRelative: true})
    }
})

export default {setLightGroupBrightnessAbsolute, setLightGroupBrightnessRelative}