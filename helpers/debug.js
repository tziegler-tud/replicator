import SettingsService from "../services/SettingsService.js";
export default class Debug {
    static debug(message, level=1) {
        SettingsService.getSettings()
            .then(settings => {
                if(settings.system.debugLevel <= level) console.log(message);
            })
    }
    constructor(){

    }
}