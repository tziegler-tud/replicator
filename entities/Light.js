
/**
 * @class Light
 */

/**
 * @typedef LightState
 * @property {boolean} on
 * @property {number} brightness
 * @property {number} hue
 * @property {number} sat
 * @property {boolean} reachable
 * @property {number} color_temperature
 * @property {string} action
 * @property {LightColorObject} color
 */

/**
 * @typedef LightColorObject
 * @property [rgb]
 * @property {number} rgb.r
 * @property {number} rgb.g
 * @property {number} rgb.b
 * @property [hsv]
 * @property {number} hsv.h
 * @property {number} hsv.s
 * @property {number} hsv.v
 */

/**
 * @typedef LightProperties
 * @property {LightState} state
 */

/**
 * @typedef LightStateUpdate
 * @property {boolean} [on]
 * @property {number} [brightness]
 * @property {number} [ct]
 * @property {number} [hue]
 * @property {number} [sat]
 * @property {boolean} [reachable]
 * @property {LightColorObject} [color]
 * @property {string} [action]
 * @property {number} [color_temperature]
 */

import ColorParser from "../helpers/colorParser.js";

/**
 * @typedef {Object} LightColorObject
 * @property {Object} [hsv]
 * @property {number} hsv.h hue value in range 0-360
 * @property {number} hsv.s saturation value in range 0-254
 * @property {number} hsv.v brightness value in range 0-254 (default, can be changed)
 * @property {Object} [rgb]
 * @property {number} rgb.r red value 0-254
 * @property {number} rgb.g green value 0-254
 * @property {number} rgb.b blue value 0-254
 * @property {Object} [xy]
 * @property {number} xy.x CIE xy color space x coordinate [0-1]
 * @property {number} xy.y CIE xy color space y coordinate [0-1]
 */


export default class Light {
    constructor({uniqueId, identifier= "NewDefaultLight", nativeObject={}, configuration={}}={}){
        this.id = undefined;
        this.uniqueId = uniqueId;
        this.identifier = identifier;
        this.state = {
            on: false,
            brightness: 0,
            hue: 0,
            sat: 0,
            reachable: false,
            color_temperature: 0,
            action: "none",
            color: {},
        };
        let defaultConfiguration = {
            brightness: {
                max: 254,
                min: 0,
            }
        }
        this.colorParser = new ColorParser({maxBrightness: 254});
        this.configuration = Object.assign(defaultConfiguration, configuration);
        this.nativeObject = nativeObject;
        this.settings = {
            identifier: identifier,
        };
        this.properties = {};
    }

    /**
     *
     * @param state {LightState}
     * @returns {LightState}
     */
    parseState(state){
        //parse an object to the target state
        return {
            on: state.on,
            brightness: state.brightness,
            hue: state.hue,
            sat: state.sat,
            reachable: state.reachable,
            action: state.action,
            color_temperature: state.color_temperature,
        }
    }

    get() {
        // return {
        //     id: this.id,
        //     uniqueId: this.uniqueId,
        //     identifier: this.identifier,
        //     state: this.state,
        // }
        return this;
    }

    getJson(){
        return {
            id: this.id,
            uniqueId: this.uniqueId,
            identifier: this.identifier,
            state: this.state,
            configuration: this.configuration ,
            nativeObject: this.nativeObject,
            settings: this.settings,
            properties: this.properties,
        }
    }

    async getState(){
        return this.state;
    }

    /**
     *
     * @param state {LightStateUpdate}
     * @returns {Promise<void>}
     */
    async setState(state){
        Object.assign(this.state, state);
    }

    getInternalState(){
        return this.state;
    }
    setInternalState(state){
        Object.assign(this.state, state);
    }

    /**
     * turns the light on or off
     * @param state {Boolean}
     */
    onOff(state){
        return this.setState({on: state})
    }

    on(){
        return this.setState({on: true})
    };
    off(){
        return this.setState({on: true})
    };
    toggle(){
        return this.setState({on: true})
    };

    setBrightness({percentValue= 0, isRelative=false}={}){
        let updatedVal = this.parseBrightness(percentValue);
        if(isRelative) {
            return this.setBrightnessRelative(updatedVal)
        }
        else {
            return this.setBrightnessAbsolute(updatedVal)
        }
    }

    async setBrightnessAbsolute(val){
        return this.setState({brightness: this.normalizeBrightness(val)});
    }
    async setBrightnessRelative(val){
        const current = this.getState().brightness;
        const updatedVal = current + val;
        return this.setState({brightness: this.normalizeBrightness(updatedVal)});
    }

    async setColor({h,s,v}){
        return this.setState({color: {hsv: {h:h,s:s,v:v}}})
    }

    async setColorRgb({r,g,b}){
        return this.setState({color: {rgb: {r:r, g:g, b:b}}})

    }


    loadSettings(dbSettings){
        this.settings = dbSettings;
        this.id = dbSettings.id;
        this.identifier = dbSettings.identifier;
    }

    saveToDb(){
        let self = this;
        return new Promise(function(resolve, reject){
            self.settings.save()
                .then(settings => {
                    self.settings=settings;
                    resolve(self);
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    /**
     *
     * @param percent {string|number} percent value, potentially a string with % at the end
     * @param [max] {number} maximum brightness used for normalizing. Defaults to the objects configuration
     * @param [min] {number} minimum brightness used for normalizing. Defaults to the objects configuration
     * @returns {number} A number in range 0 - max, where 0 equals 0% and max equals 100%;
     */
    parseBrightness(percent, max=this.configuration.brightness.max, min=this.configuration.brightness.min){
        //percent might be a string with the % symbol at the end. remove it
        if(typeof percent === "string") {
            percent.replace("%", "");
            percent = parseInt(percent);
        }
        //254 equals 100%; 0 equals 0%
        if(percent > 100) percent = 100;
        if(percent < -100) percent = -100;
        if(percent === 0) return min;
        return Math.round(min + (percent/100) * (max-min));
    }

    /**
     * Returns a Value as integer between 0 - 254.
     * @param brightness {number|string}
     * @param [max] {number} maximum brightness used for normalizing. Defaults to the objects configuration
     * @param [min] {number} minimum brightness used for normalizing. Defaults to the objects configuration
     * @returns {number}
     */
    normalizeBrightness(brightness, max=this.configuration.brightness.max, min=this.configuration.brightness.min) {
        brightness = parseInt(brightness);
        if (brightness > max) return max;
        if (brightness < min) return min;
        return brightness
    }
}