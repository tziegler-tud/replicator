import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";

/**
 * changes the state of a single Light
 */



let setLightColorHsv = new Skill({
    identifier: "setLightGroupColorHsv",
    title: "Color - HSV",
    description: "Set the color of the light group using hsv values. Value range is: Hue: 0-360, Saturation: 0 - 100, Brightness: 0-100",
    variables: {
        lightId: Skill.variableTypes.light,
        hue: Skill.variableTypes.NUMBER,
        saturation: Skill.variableTypes.NUMBER,
        brightness: Skill.variableTypes.NUMBER,
    },
    handler: async function({handlerArgs, configuration}){
        let light = await LightsService.getLightByUniqueId(handlerArgs.lightId);
        return light.setColor({h: handlerArgs.hue,s: handlerArgs.saturation,v:handlerArgs.brightness})
    }
})


let setLightColorRgb = new Skill({
    identifier: "setLightGroupColorRgb",
    title: "Color - RGB",
    description: "Set the color of the light group using rgb values. Value range is 0-255",
    variables: {
        lightId: Skill.variableTypes.light,
        red: Skill.variableTypes.NUMBER,
        green: Skill.variableTypes.NUMBER,
        blue: Skill.variableTypes.NUMBER,
    },
    handler: async function({handlerArgs, configuration}){
        let light = await LightsService.getLightByUniqueId(handlerArgs.lightId);
        return light.setColorRgb({r: handlerArgs.red,g: handlerArgs.green,b: handlerArgs.blue})
    }
})

export default {setLightColorHsv, setLightColorRgb}