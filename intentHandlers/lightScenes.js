const IntentHandler = require("./intentHandler");
const LightsService = require("../services/LightsService");
const LocationManager = require("../services/LocationManager");

const lightsService = LightsService.getInstance();

var lightScenes = []

const h1 = new IntentHandler();
h1.addVariable("lightScene", "lightScenes", IntentHandler.EXPECTATION.REQUIRED);
h1.setHandlerFunction(function(variables, location, handler){
    let defaults = {

    }
    variables = Object.assign(defaults, variables);
    if(variables.location) {
        location = LocationManager.getInstance().getLocation(variables.location);
    }
    let alias = getLightSceneAlias(variables.lightScene);
    //change light Scene in current location
    return setSceneAllGroups(location.lightGroups,alias);
})

lightScenes.push(h1);

const h2 = new IntentHandler();
h2.addVariable("lightScene", "lightScenes", IntentHandler.EXPECTATION.FORBIDDEN);
h2.setHandlerFunction(function(variables, location, handler){
    let defaults = {

    }
    variables = Object.assign(defaults, variables);
    if(variables.location) {
        location = LocationManager.getInstance().getLocation(variables.location);
    }
    //select scene by time of day
    let alias = getCurrentTimeOfDayAlias();
    //change light Scene in current location
    return setSceneAllGroups(location.lightGroups, alias);
})

lightScenes.push(h2);

function setSceneAllGroups(lightGroupArray, sceneName){
    lightGroupArray.forEach(function(lightGroup){
        lightsService.setLightGroupScene(lightGroup.id, sceneName)
    })
    return true;
}

function getLightSceneAlias(sceneSelect){
    switch(sceneSelect){
        case "Sunrise":
            return alias.sunrise;
        case "Sunset":
            return alias.sunset;
        case "Daylight":
            return alias.day;
        case "Evening":
            return alias.evening;
        case "Night":
            return alias.night;
        case "Focus":
            return alias.focus;
    }
}

function getCurrentTimeOfDayAlias(){
    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();

    if (hours < 6 || hours >= 23) {
        //its night
        return alias.night;
    }
    if (hours < 9) {
        return alias.sunrise;
    }
    if (hours < 17) {
        return alias.day;
    }
    if (hours < 20) {
        return alias.sunset
    }
    if (hours <= 23) {
        return alias.evening
    }
    return alias.day; //fallback
}

let alias = {
    night: "replicator_night",
    sunrise: "replicator_sunrise",
    day: "replicator_daylight",
    sunset: "replicator_sunset",
    evening: "replicator_evening",
    focus: "replicator_focus",
}

module.exports = lightScenes;

