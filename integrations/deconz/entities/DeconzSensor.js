import Light from "../../../entities/Light.js";
import ColorParser from "../../../helpers/colorParser.js";
import state from "../../../skills/Light/light/state.js";
import Sensor from "../../../entities/Sensor.js";

const hueMax = 65535;
/**
 * @typedef DeconzNativeSensor
 * @property {string} etag
 * @property {boolean} hascolor
 * @property {string} manufacturer
 * @property {string} modelid
 * @property {string} name
 * @property {object} pointsymbol Not used in the current version.
 * @property {DeconzNativeLightState} state
 * @property {string} swversion
 * @property {string} type
 * @property {string} uniqueid
 */

/**
 * @typedef DeconzNativeSensorState
 * @property {string} alert
 * @property {number} bri
 * @property {string} colormode
 * @property {number} ct
 * @property {string} effect
 * @property {number} hue
 * @property {number} sat
 * @property {boolean} on
 * @property {string} reachable
 * @property {number[]} [xy]
 */

/**
 * @typedef DeconzNativeSensorStateUpdate
 * @property {string} [alert] one of "none", "select", "lselect"
 * @property {number} [bri] brightness 0-255
 * @property {number} [colorloopspeed] Specifies the speed of a colorloop (default: 15). 1- 255
 * @property {number} [ct] Set the Mired color temperature of the light.
 * @property {string} [effect] one of "none", "colorloop"
 * @property {number} [hue] set the hue color in 16-bit resolution. 0-65535
 * @property {number} [sat] Set the color saturation of the light. 0-255
 * @property {boolean} [on] true to turn light on, false to turn light off
 * @property {number} [transitiontime] Transition time in 1/10 seconds between two states.
 * @property {number[]} [xy] Set the CIE xy color space coordinates as array [x, y] of real values (0–1).
 */


export default class DeconzSensor extends Sensor {
    /**
     *
     * @param bridgeApi
     * @param deconzObject {DeconzNativeLight}
     * @param uniqueId
     * @param deconzId
     * @param identifier
     * @param integration
     */


    constructor({bridgeApi, nativeObject, uniqueId, deconzId, lightId, identifier="MyDeconzSensor", integration}={}){
        super({uniqueId: uniqueId, identifier: identifier, nativeObject: nativeObject, configuration: {}});

        this.deconzId = deconzId;
        /**
         * @type {DeconzBridgeApi}
         */
        this.bridgeApi = bridgeApi;
        this.state = this.parseNativeToState(nativeObject);
        this.integration = integration;
        /**
         *
         * @type {DeconzNativeLight}
         */
        this.nativeObject = nativeObject;
    }

    /**
     *
     * @param nativeObject {DeconzNativeLight}
     * @returns {LightState}
     */
    parseNativeToState(nativeObject){
        return {
            value: 0,
            unit: undefined,
        }
    }

    /**
     *
     * @param nativeObject {DeconzNativeLight}
     * @returns {LightState}
     */
    parseNativeChangeToState(nativeObject){
        let stateChange = Object.assign(this.nativeObject, nativeObject);
        return this.parseNativeToState(stateChange)

    }

    /**
     *
     * @param state {LightStateUpdate}
     * @returns {DeconzNativeLightState}
     */
    parseStateChangeToNative(state){
        let oj = {}
        if(state.on !== undefined) oj.on = state.on;
        if(state.brightness !== undefined) oj.bri = this.parseBrightness(state.brightness);
        if(state.hue !== undefined) oj.hue = this.colorParser.normalize({max: hueMax, value: (state.hue / 360)});
        if(state.sat !== undefined) oj.sat = state.sat;
        if(state.color_temperature) oj.ct = state.color_temperature;
        if(state.action) oj.alert = state.action;
        return oj;
    }

    /**
     *
     * @param {DeconzNativeLight} deconzLight
     * @returns {DeconzNativeLightStateUpdate}
     */
    parseNativeToStateUpdate(deconzLight) {
        return {
            bri: deconzLight.state.bri,
            ct: deconzLight.state.ct,
            hue: deconzLight.state.hue,
            sat: deconzLight.state.sat,
            xy: deconzLight.state.xy,
        }
    }

    /**
     *
     * @param state {LightStateUpdate}
     * @returns {DeconzNativeLightStateUpdate}
     */
    parseStateChangeToNativeUpdate(state){
        /**
         *
         * @type {DeconzNativeLightStateUpdate}
         */
        let oj = this.parseStateChangeToNative(state);
        if(state.color) {
            if(state.color.hsv) {
                oj.hue = state.color.hsv.h;
                oj.sat = state.color.hsv.s;
                oj.bri = state.color.hsv.v;
            }
            else {
                if(state.color.rgb) {
                    const {h,s,v} = this.colorParser.rgbToHSV({r: state.color.rgb.r, g: state.color.rgb.g, b: state.color.rgb.b});
                    oj.hue = this.colorParser.normalize({max: 65535, value: h/360});
                    oj.sat = this.colorParser.normalize({max: 255, value: s/100});
                    oj.bri = this.colorParser.normalize({max: 255, value: v/100});
                }
                else if (state.color.xy){
                    oj.xy = [state.color.xy.x, state.color.xy.y];
                }
            }
        }
        return oj;
    }

    /**
     *
     * @param state
     * @returns {Promise<void>}
     */
    async setState(state){
        return this.bridgeApi.setLightState(this.lightId, this.parseStateChangeToNativeUpdate(state));
    }

    /**
     *
     * @param {DeconzLight} deconzLight
     * @returns {Promise<void>}
     */
    async restoreState(deconzLight){
        let state = this.parseStateChangeToNativeUpdate(deconzLight.state)
        // if(deconzLight.nativeObject) {
        //     state = this.parseNativeToStateUpdate(deconzLight.nativeObject);
        // }
        this.bridgeApi.setLightState(this.lightId, state)
    }

    /**
     *
     * @returns {Promise<object>}
     */
    async getState(){
        this.nativeObject = await this.bridgeApi.getLightState(this.lightId);
        this.state = this.parseNativeToState(this.nativeObject);
        return this.state;
    }


    getInternalState(){
        return this.state;
    }
    setInternalState(nativeObject){
        this.state = this.parseNativeChangeToState(nativeObject);
    }


    async on(){
        return this.setState({on: true})
    };
    async off(){
        return this.setState({on: false})
    };
    async toggle(){
        let state = await this.getState();
        return this.setState({on: !state.on})
    };

    async setColor({h,s,v}){
        return this.setState({color: {hsv: {h:h,s:s,v:v}}})
    }

    async setColorRgb({r,g,b}){
        return this.setState({color: {rgb: {r:r, g:g, b:b}}})

    }

    alert(){
        return this.setState({
            action: "select",
        })
    }

    /**
     *
     * @returns {DeconzLight}
     */
    clone() {
        let l = new DeconzSensor({
            bridgeApi: this.bridgeApi,
            nativeObject: JSON.parse(JSON.stringify(this.nativeObject)),
            uniqueId: this.uniqueId,
            deconzId: this.deconzId,
            identifier: this.identifier,
            integration: this.integration,
        });
        l.id = this.id;
        l.configuration = this.configuration;
        l.properties = this.properties;
        l.state = this.state;
        return l;
    }
}