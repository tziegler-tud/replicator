import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";

/**
 * changes the state of a single Light
 */


let setLightColor = new Skill({
    identifier: "setLightColor",
    title: "Color",
    description: "Set the color of the light",
    variables: {
        lightId: Skill.variableTypes.light,
        color: Skill.variableTypes.OBJECT,
    },
    handler: async function({handlerArgs, configuration, intentHandler}){
        let light = await LightsService.getLightByUniqueId(handlerArgs.lightId);
        light.setColor(handlerArgs.color)
    }
})

export default {setLightColor}