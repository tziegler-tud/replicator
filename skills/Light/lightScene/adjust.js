import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";

/**
 * changes the state of a single Light
 */

let LightSceneAdjust = new Skill({
    identifier: "LightsceneAdjust",
    description: "Activate a scene",
    variables: {
        sceneId: Skill.variableTypes.lightScene,
    },
    handler: async function({handlerArgs, configuration}){
        let scene = await LightsService.getSceneByUniqueId(handlerArgs.sceneId);
        scene.activate();
    }
})

export default {LightSceneAdjust}