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
    handler: async function({handlerArgs, configuration}){
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
        negative: Skill.variableTypes.BOOLEAN,
    },
    handler: async function({handlerArgs, configuration}){
        let light = await LightsService.getGroupByUniqueId(handlerArgs.groupId);
        let percentVal = handlerArgs.negative ? handlerArgs.percentValue.toInt() : (-1) * handlerArgs.percentValue.toInt();
        light.setBrightness({percentValue: percentVal, isRelative: true})
    }
})

let setLightGroupBrightnessVariable = new Skill({
    identifier: "setLightGroupBrightnessVariable",
    title: "Brightness - Variable",
    description: "Absolute or relative brightness change",
    variables: {
        groupId: Skill.variableTypes.lightGroup,
        percentValue: Skill.variableTypes.PERCENT,
        absolute: Skill.variableTypes.BOOLEAN,
        negative: Skill.variableTypes.BOOLEAN,
    },
    handler: async function({handlerArgs, configuration}){
        let light = await LightsService.getGroupByUniqueId(handlerArgs.groupId);
        let percentVal = handlerArgs.negative ? (-1) * handlerArgs.percentValue : handlerArgs.percentValue;
        light.setBrightness({percentValue: percentVal, isRelative: !handlerArgs.absolute})
    }
})

export default {setLightGroupBrightnessAbsolute, setLightGroupBrightnessRelative, setLightGroupBrightnessVariable}