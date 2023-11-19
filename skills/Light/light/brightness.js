import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";

/**
 * changes the state of a single Light
 */

let setLightBrightnessAbsolute = new Skill({
    identifier: "setLightBrightnessAbsolute",
    title: "Brightness - Absolute",
    description: "Set the brightness to a specific value",
    variables: {
        lightId: Skill.variableTypes.light,
        percentValue: Skill.variableTypes.PERCENT,
    },
    handler: async function({handlerArgs, configuration}){
        let light = await LightsService.getLightByUniqueId(handlerArgs.lightId);
        light.setBrightness({percentValue: handlerArgs.percentValue, isRelative: false})
    }
})

let setLightBrightnessRelative = new Skill({
    identifier: "setLightBrightnessRelative",
    title: "Brightness - Relative",
    description: "Increase or decrease current brightness",
    variables: {
        lightId: Skill.variableTypes.light,
        percentValue: Skill.variableTypes.PERCENT,
    },
    handler: async function({handlerArgs, configuration}){
        let light = await LightsService.getLightByUniqueId(handlerArgs.lightId);
        light.setBrightness({percentValue: handlerArgs.percentValue, isRelative: true})
    }
})

export default {setLightBrightnessAbsolute, setLightBrightnessRelative}