import Light from "../../../entities/Light.js";
import ColorParser from "../../../helpers/colorParser.js";

export default class HueLight extends Light {
    constructor({bridgeApi, hueObject, uniqueId, lightId, identifier="MyHueLight", integration}={}){
        super({uniqueId: uniqueId, identifier: identifier, nativeObject: hueObject, configuration: {
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

    parseHueToState(hueObject){
        return {
            on: hueObject.on.on,
            brightness: hueObject.dimming ? hueObject.dimming.brightness : 100,
            color: this.parseColor(hueObject),
            reachable: "not implemented", //use new zigbee_connectivity status for this, will implement later
            color_temperature: hueObject.color_temperature,
        }
    }

    parseHueChangeToState(hueObject){
        let stateChange = Object.assign(this.nativeObject, hueObject);
        return this.parseHueToState(stateChange)

    }

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
     * @param state
     * @returns {Promise<void>}
     */
    async setState(state){
        this.bridgeApi.setLightState(this.lightId, this.parseStateChangeToHue(state));
    }

    /**
     *
     * @returns {Promise<object>}
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

    setColor({h,s,v}){
        const xyBri = this.colorParser.hsvToXYBri({h:h, s:s, v:v});
        this.setState({
            dimming: {
                brightness: xyBri.bri,
            },
            color: {
                xy: {
                    x: xyBri.x,
                    y: xyBri.y,
                }
            }
        })
    }
}