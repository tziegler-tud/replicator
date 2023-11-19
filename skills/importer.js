import lightBrightness from "./Light/light/brightness.js";
import lightColor from "./Light/light/color.js";
import lightState from "./Light/light/state.js";

import lightGroupBrightness from "./Light/lightGroup/brightness.js";
import lightGroupColor from "./Light/lightGroup/color.js";
import lightGroupState from "./Light/lightGroup/state.js";

import lightSceneState from "./Light/lightScene/state.js";
import lightSceneAdjust from "./Light/lightScene/adjust.js";
import httpRequest from "./Connections/http/httpRequest.js";
import alertState from "./Alerts/Alerts/state.js";

class SkillImporter {
    constructor(){
        this.skills = this.importSkills();

    }

    importSkills(){
        let skills = {
            Light: {
                light: {
                    brightness: importSkill(lightBrightness),
                    color: importSkill(lightColor),
                    state: importSkill(lightState),
                },
                lightGroup: {
                    brightness: importSkill(lightGroupBrightness),
                    color: importSkill(lightGroupColor),
                    state: importSkill(lightGroupState),
                },
                lightScene: {
                    state: importSkill(lightSceneState),
                    adjust: importSkill(lightSceneAdjust)
                }
            },
            Alerts: {
                Alerts: {
                    state: importSkill(alertState)
                }
            },
            Music: {},
            Sound: {},
            Voice: {},
            Connections: {
                http: {
                    httpRequest: importSkill(httpRequest),
                }
            }
        }

        return skills;

        /**
         * @typedef skillObject
         * An Object containing skills.
         */

        /**
         *
         * @param skillObject
         */
        function importSkill(skillObject){
            //check for duplicate identifier
            let identifiers = [];
            for (const [key, skill] of Object.entries(skillObject)){
                if(identifiers.includes(skill.identifier)){
                    console.warn("Skillimporter | Warning: Duplicate identifier found: " + skill.identifier + ". Element not imported");
                    delete skillObject[key]
                }
                else {
                    identifiers.push(skill.identifier);
                }
            }
            return skillObject;
        }
    }

    getSkills(){
        return this.skills;
    }
}
export default new SkillImporter();