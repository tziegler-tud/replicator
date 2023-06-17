import Skill from "../../skill.js";
import LightsService from "../../../services/LightsService.js";

/**
 * changes the state of a single Light
 */

let LightSceneActivate = new Skill({
    identifier: "LightsceneActivate",
    description: "Activate a scene",
    variables: {
        sceneId: Skill.variableTypes.lightScene,
    },
    handler: async function({handlerArgs, configuration, intentHandler}){
        let scene = await LightsService.getSceneByUniqueId(handlerArgs.sceneId);
        scene.activate();
    }
})

export default {LightSceneActivate}