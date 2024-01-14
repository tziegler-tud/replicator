import LightGroup from "../../../entities/LightGroup.js";
const hueMax = 65535;

/**
 * @class DeconzLightGroup
 */

/**
 * @typedef DeconzNativeLightGroup
 * @property {DeconzNativeLightGroupState} action The last action which was send to the group.
 * @property {string[]} devicemembership A list of device ids (sensors) if this group was created by a device.
 * @property {string} etag
 * @property {boolean} hidden
 * @property {string} id
 * @property {string[]} lights A list of all light ids of this group. Sequence is defined by the gateway.
 * @property {string[]} lightsequence A list of light ids of this group that can be sorted by the user. Need not to contain all light ids of this group.
 * @property {string[]} mulitdeviceids A list of light ids of this group that are subsequent ids from multidvices with multiple endpoints like the FLS-PP.
 * @property {string} name Name of the group.
 * @property {string[]} scenes A list of scenes of the group.
 *
 */

/**
 * @typedef DeconzNativeLightGroupState
 * @property {boolean} on
 * @property {number} bri
 * @property {number} hue
 * @property {number} sat
 * @property {number} ct
 * @property {number[]} [xy]
 * @property {string} effect
 */


/**
 * @typedef DeconzNativeLightGroupStateUpdate
 * @property {boolean} on Set to true to turn the lights on, false to turn them off.
 * @property {boolean} toggle Set to true toggles the lights of that group from on to off or vice versa, false has no effect. **Notice:** This setting supersedes the `on` parameter!
 * @property {number} bri Set the brightness of the group. Depending on the lights 0 might not mean visible "off" but minimum brightness. If the lights are off and the value is greater 0 a on=true shall also be provided.
 * @property {number} hue Set the color hue of the group. The hue parameter in the HSV color model is between 0°–360° and is mapped to 0–65535 to get 16-bit resolution.
 * @property {number} sat Set the color saturation of the group. There 0 means no color at all and 255 is the highest saturation of the color.
 * @property {number} ct Set the Mired color temperature of the group. (2000K–6500K)
 * @property {number[]} [xy] Set the CIE xy color space coordinates as array [x, y] of real values (0–1).
 * @property {string} alert Trigger a temporary alert effect: none - lights are not performing an alert, select - lights are blinking a short time, lselect - lights are blinking a longer time
 * @property {string} effect TTrigger an effect of the group: none - no effect, colorloop - the lights of the group will cycle continously through all colors with the speed specified by colorloopspeed
 * @property {number} colorloopspeed Specifies the speed of a colorloop. 1 = very fast, 255 = very slow (default: 15). This parameter only has an effect when it is called together with effect colorloop.
 * @property {number} transitiontime Transition time in 1/10 seconds between two states.
 */

export default class DeconzLightGroup extends LightGroup {
    /**
     *
     * @param uniqueId
     * @param identifier
     * @param {string} deconzGroupId
     * @param {DeconzNativeLightGroup} nativeObject
     * @param {DeconzBridgeApi} bridgeApi
     * @param configuration
     */
    constructor({uniqueId, identifier= "NewDeconzLightGroup", deconzGroupId, bridgeApi, nativeObject={}, configuration={}}={}){
        super({uniqueId: uniqueId, identifier: identifier, nativeObject: nativeObject, configuration: configuration});
        this.lights = [];
        this.scenes = [];
        this.bridgeApi = bridgeApi;
        this.deconzGroupId = deconzGroupId;
    }

    get(){
        // return {
        //     id: this.id,
        //     uniqueId: this.uniqueId,
        //     identifier: this.identifier,
        //     state: this.state,
        //     lights: this.lights,
        //     scenes: this.scenes,
        // }
        return this;
    }


    /**
     *
     * @returns {LightGroup}
     */
    getJson(){
        return {
            id: this.id,
            uniqueId: this.uniqueId,
            identifier: this.identifier,
            state: this.state,
            integration: this.integration,
            configuration: this.configuration,
            settings: this.settings,
            properties: this.properties,
        }
    }

    /**
     *
     * @param nativeObject {DeconzNativeLightGroup}
     * @returns {LightGroupState}
     */
    parseNativeToState(nativeObject){
        return {
            on: nativeObject.action.on,
            brightness: nativeObject.action.bri ? this.parseBrightnessBackwards(nativeObject.action.bri) : this.configuration.brightness.max,
            color: this.parseColor(nativeObject),
            reachable: "not implemented", //use new zigbee_connectivity status for this, will implement later
            color_temperature: nativeObject.action.ct,
        }
    }

    /**
     *
     * @param nativeObject {DeconzNativeLightGroup}
     * @returns {LightGroupState}
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
     * @param state {LightGroupStateUpdate}
     * @returns {DeconzNativeLightGroupStateUpdate}
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
     * @param nativeObject {DeconzNativeLightGroup}
     * @returns {{}|{hsv: {h: number, s:number, v: number}, rgb: {r: number, b: number, g: number}}}
     */
    parseColor(nativeObject){
        if(nativeObject.action.hue && nativeObject.action.sat && nativeObject.action.bri) {
            const hsv = {h: this.colorParser.normalize({max: 360, value: nativeObject.action.hue/hueMax}), s: nativeObject.action.sat, v: nativeObject.action.bri};
            const rgb = this.colorParser.hsvToRGB(hsv)
            return {
                rgb: rgb,
                hsv: hsv,
            }
        }
        else return {};
    }

    addLight(light){
        this.lights.add(light);
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
     * @param state
     * @returns {Promise<void>}
     */
    async setState(state){
        return this.bridgeApi.setGroupState(this.deconzGroupId, this.parseStateChangeToNativeUpdate(state));
    }

    /**
     *
     * @returns {Promise<object>}
     */
    async getState(){
        this.nativeObject = await this.bridgeApi.getGroupState(this.groupId);
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
}