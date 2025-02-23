
import ColorParser from "../helpers/colorParser.js";
import Entity from "./Entity.js";


/**
 * @typedef LightConfiguration
 * @property {Object} brightness
 * @property {number} brightness.max Maximum brightness value. Defaults to 255
 * @property {number} brightness.min Minimum brightness value. Defaults to 0
 */

/**
 * @typedef LightState
 * @property {boolean} on
 * @property {number} brightness 0 - 100. Brightness is handled internally as 0-100 percent value. Automatic value parsing is done via configuration
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
 * @property {LightColorObject} [color]
 * @property {string} [action]
 * @property {number} [color_temperature]
 */


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

/**
 * @class Light
 * @property {String} uniqueId
 * @property {String} identifier
 * @property {String} lightId
 * @property {Object} nativeObject
 * @property {LightConfiguration} configuration
 */
export default class Light extends Entity {
    /**
     *
     * @type {LightConfiguration}
     */
    static defaultConfiguration = {
        brightness: {
            max: 100,
            min: 0,
        }
    };

    /**
     *
     * @param {String} uniqueId
     * @param {String} identifier
     * @param {String} lightId
     * @param {Object} nativeObject
     * @param {LightConfiguration} configuration
     */
    constructor({uniqueId, identifier= "NewDefaultLight", lightId, nativeObject={}, configuration={}}={}){
        const config = Object.assign(Light.defaultConfiguration, configuration);
        super({uniqueId, identifier, nativeObject, configuration: config});
        this.lightId = lightId;
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
        this.colorParser = new ColorParser({maxBrightness: this.configuration.brightness?.max});
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

    /**
     *
     * @param state {LightStateUpdate}
     * @returns {Promise<void>}
     */
    async setState(state){
        Object.assign(this.state, state);
    }

    /**
     *
     * @param {Light} light
     * @returns {Promise<void>}
     */
    async restoreState(light){
        return this.setState(light.state);
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

    /**
     *
     * @param value {number} a value between min - max
     * @param [max] {number} maximum brightness used for normalizing. Defaults to the objects configuration
     * @param [min] {number} minimum brightness used for normalizing. Defaults to the objects configuration
     * @returns {number} A number in range 0-100
     */
    parseBrightnessBackwards(value=0, max=this.configuration.brightness.max, min=this.configuration.brightness.min){
        if (value === 0 || value <= min) return 0;
        if (value >= max) return 100
        return this.parseBrightness(100*value/max, 100, 0);
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

    /**
     *
     * @returns {Light}
     */
    clone() {
        let l = new Light({
            uniqueId: this.uniqueId,
            identifier: this.identifier,
            nativeObject: this.nativeObject,
            configuration: this.configuration,
        });
        l.id = this.id;
        l.state = this.state;
        l.configuration = this.configuration;
        l.properties = this.properties;
    }
}