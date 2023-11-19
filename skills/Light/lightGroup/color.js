import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";

/**
 * changes the state of a single Light
 */


let setLightGroupColor = new Skill({
    identifier: "setLightGroupColor",
    title: "Color",
    description: "Set the color of the LightGroup",
    variables: {
        groupId: Skill.variableTypes.lightGroup,
        color: Skill.variableTypes.OBJECT,
    },
    handler: async function({handlerArgs, configuration}){
        let light = await LightsService.getGroupByUniqueId(handlerArgs.groupId);
        light.setColor(handlerArgs.color)
    }
})

export default {setLightGroupColor}