import lightBrightness from "./Light/light/brightness.js";
import lightColor from "./Light/light/color.js";
import lightState from "./Light/light/state.js";

import lightGroupBrightness from "./Light/lightGroup/brightness.js";
import lightGroupColor from "./Light/lightGroup/color.js";
import lightGroupState from "./Light/lightGroup/state.js";

import lightSceneState from "./Light/lightScene/state.js";

let skills = {
    Light: {
        light: {
            brightness: lightBrightness,
            color: lightColor,
            state: lightState,
        },
        lightGroup: {
            brightness: lightGroupBrightness,
            color: lightGroupColor,
            state: lightGroupState,
        },
        lightScene: {
            state: lightSceneState,
        }
    }
}
export default skills;