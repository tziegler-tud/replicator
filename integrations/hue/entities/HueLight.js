import Light from "../../../entities/Light.js";
import ColorParser from "../../../helpers/colorParser.js";


/**
 * @typedef HueOnObject
 * @property {boolean} on
 */
/**
 * @typedef HueDimmingObject
 * @property {number} brightness
 * @property {number} min_dim_level
 */

/**
 * @typedef HueColorTemperatureObject
 * @property {number} mirek
 * @property {boolean} mirek_valid
 * @property {object} mirek_schema
 * @property {number} mirek_schema.mirek_minimum
 * @property {number} mirek_schema.mirek_maximum
 */

/**
 * @typedef HueColorObject
 * @property {object} xy
 * @property {number} xy.x
 * @property {number} xy.y
 * @property {object} gamut
 * @property {object} gamut.red
 * @property {number} gamut.red.x
 * @property {number} gamut.red.y
 * @property {object} gamut.green
 * @property {number} gamut.green.x
 * @property {number} gamut.green.y
 * @property {object} gamut.blue
 * @property {number} gamut.blue.x
 * @property {number} gamut.blue.y
 * @property {string} gamut_type
 */

/**
 * @typedef HueNativeLight
 * @property {string} type
 * @property {string} id
 * @property {string} id_v1
 * @property {object} owner
 * @property {string} owner.rid
 * @property {string} owner.rtype
 * @property {object} metadata
 * @property {string} metadata.name
 * @property {string} metadata.archetype
 * @property {number} fixed_mired
 * @property {HueOnObject} on
 * @property {HueDimmingObject} dimming
 * @property {HueColorTemperatureObject} color_temperature
 * @property {HueColorObject} color
 * @property {object} dynamics
 * @property {string} dynamics.status
 * @property {string[]} dynamics.status_values
 * @property {number} dynamics.speed
 * @property {boolean} dynamics.speed_valid
 * @property {object} alert
 * @property {string[]} alert.action_values
 *
 */


/**
 * @typedef HueNativeLightStateUpdate
 * @property {string} type
 * @property {object} metadata
 * @property {string} metadata.name
 * @property {string} metadata.archetype
 * @property {object} identify
 * @property {string} identify.action
 * @property {object} on
 * @property {boolean} on.on
 * @property {object} dimming
 * @property {number} dimming.brightness
 * @property {object} dimming_delta
 * @property {string} dimming_delta.action one of up, down, stop
 * @property {number} dimming_delta.brightness_delta Brightness percentage of full-scale increase delta to current dimlevel. Clip at Max-level or Min-level.
 * @property {object} color_temperature
 * @property {number} color_temperature.mirek color temperature in mirek or null when the light color is not in the ct spectrum
 * @property {object} color_temperature_delta
 * @property {string} color_temperature_delta.action one of up, down, stop
 * @property {number} color_temperature_delta.mirek_delta Mirek delta to current mirek. Clip at mirek_minimum and mirek_maximum of mirek_schema
 * @property {object} color
 * @property {object} color.xy
 * @property {number} color.xy.x
 * @property {number} color.xy.y
 * @property {object} dynamics
 * @property {number} dynamics.duration
 * @property {number} dynamics.speed
 * @property {object} alert
 * @property {string} alert.action
 *
 */


/**
 * @class HueLight
 * @property {String} uniqueId
 * @property {String} identifier
 * @property {String} lightId
 * @property {Object} nativeObject
 * @property {LightConfiguration} configuration
 */
export default class HueLight extends Light {
    constructor({bridgeApi, hueObject, uniqueId, lightId, identifier="MyHueLight", integration}={}){
        super({uniqueId: uniqueId, identifier: identifier, lightId, nativeObject: hueObject, configuration: {
                brightness: {
                    max: 100,
                    min: 0,
                }
            }});
        this.lightId = lightId;
        this.bridgeApi = bridgeApi;
        this.colorParser = new ColorParser({maxBrightness: 100});
        this.state = this.parseHueToState(hueObject);
        this.integration = integration;
        this.nativeObject = hueObject;
    }

    get(){
        return this;
    }

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
     * @param hueObject {HueNativeLight}
     * @returns {LightState}
     */
    parseHueToState(hueObject){
        return {
            on: hueObject.on.on,
            brightness: hueObject.dimming ? hueObject.dimming.brightness : 100,
            color: this.parseColor(hueObject),
            reachable: "not implemented", //use new zigbee_connectivity status for this, will implement later
            color_temperature: hueObject.color_temperature,
        }
    }

    /**
     *
     * @param hueObject {HueNativeLight}
     * @returns {LightState}
     */

    parseHueChangeToState(hueObject){
        let stateChange = Object.assign(this.nativeObject, hueObject);
        return this.parseHueToState(stateChange)

    }

    /**
     *
     * @param state {HueNativeLight}
     * @returns {HueNativeLightStateUpdate}
     */
    parseNativeToStateUpdate(state){
        let oj = {
            on: state.on,
            dimming: state.dimming,
        }

        if(state.color_temperature && state.color_temperature.mirek !== null) {
            oj.color_temperature = state.color_temperature;
        }
        if(state.color) {
            oj.color = state.color;
        }
        // if(state.alert) oj.alert = state.alert;
        return oj;
    }

    /**
     *
     * @param state {LightStateUpdate}
     * @returns {HueNativeLightStateUpdate}
     */
    parseStateChangeToHue(state){
        let oj = {}
        if(state.on !== undefined) oj.on = {on: state.on};
        if(state.brightness !== undefined) oj.dimming = {brightness: state.brightness}
        if(state.hue !== undefined && state.sat !== undefined && state.brightness !== undefined) {
            const xyBri = this.colorParser.hsvToXYBri({h: state.hue, s: state.sat, v: state.brightness});
            oj.color = {
                xy: {
                    x: xyBri.x,
                    y: xyBri.y,
                }
            }
            oj.brightness = xyBri.bri;
        }
        else {
            if(state.color) {
                let xyBri = undefined;
                if(state.color.hsv) {
                    xyBri = this.colorParser.hsvToXYBri({h: state.color.hsv.h, s: state.color.hsv.s, v: state.color.hsv.v});
                }
                else {
                    if(state.color.rgb) {
                        xyBri = this.colorParser.rgbToXYBri({r: state.color.rgb.r, g: state.color.rgb.g, b: state.color.rgb.b});
                    }
                }
                if(xyBri){
                    oj.color = {
                        xy: {
                            x: xyBri.x,
                            y: xyBri.y,
                        }
                    }
                    oj.brightness = xyBri.bri;
                }
            }
        }
        if(state.color_temperature && state.color_temperature.mirek) oj.color_temperature = {mirek: state.color_temperature.mirek};
        return oj;
    }

    /**
     *
     * @param state {LightState}
     * @returns {HueNativeLightStateUpdate}
     */
    parseStateToHue(state){
        const xyBri = this.colorParser.hsvToXYBri({h: state.hue, s: state.sat, v: state.brightness});
        return {
            on: {
                on: state.on
            },
            dimming: {
                brightness: xyBri,
            },
            color: {
                xy: {
                    x: xyBri.x,
                    y: xyBri.y,
                }
            }
        }
    }

    /**
     *
     * @param hue {HueNativeLight}
     * @returns {{}|{hsv: {h, s, v: number}, rgb: {r: number, b: number, g: number}}}
     */
    parseColor(hue){
        if(hue.color) {
            if(hue.color.xy) {
                const x = hue.color.xy.x;
                const y = hue.color.xy.y;
                const bri = hue.dimming.brightness;

                let rgb = this.colorParser.xyBriToRgb({x:x,y:y,bri:bri});
                let hsv = this.colorParser.rgbToHSV(rgb);
                return {
                    rgb: rgb,
                    hsv: hsv,
                }
            }
            else {
                //no xy color property set
                return {};
            }
        }
        else return {};
    }

    /**
     *
     * @param state {LightState}
     * @returns {Promise<void>}
     */
    async setState(state){
        this.bridgeApi.setLightState(this.lightId, this.parseStateChangeToHue(state));
    }

    async restoreState(hueLight){
        let state = this.parseStateChangeToHue(hueLight.state)
        if(hueLight.nativeObject) {
            state = this.parseNativeToStateUpdate(hueLight.nativeObject);
        }
        this.bridgeApi.setLightState(this.lightId, state)
            .then(response => {
                return response;
            })
            .catch(err => {
                return err;
            })
    }

    /**
     *
     * @returns {Promise<LightState>}
     */
    async getState(){
        this.nativeObject = await this.bridgeApi.getLightState(this.lightId);
        this.state = this.parseHueToState(this.nativeObject);
        return this.state;
    }


    getInternalState(){
        return this.state;
    }
    setInternalState(hueObject){
        this.state = this.parseHueChangeToState(hueObject);
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

    /**
     * relative brightness change. negative values to decrease
     * @param value
     */
    setBrightnessRelative(value=0){
        let absVal = value;
        let action = "up";
        if(value<0){
            //neg value.
            absVal = value * -1;
            action = "down";
        }
        return this.setState({
            dimming_delta: {
                action: action,
                brightness_delta: absVal,
            }
        })
    }

    setBrightnessAbsolute(value=0){
        const bri = this.normalizeBrightness(value)
        return this.setState({
            dimming: {
                brightness: bri,
            }
        })
    }

    alert(){
        return this.setState({
            action: "breathe",
        })
    }


    /**
     * @returns {HueLight}
     */
    clone() {
        let l = new HueLight({
            bridgeApi: this.bridgeApi,
            hueObject: JSON.parse(JSON.stringify(this.nativeObject)),
            uniqueId: this.uniqueId,
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