import LightGroup from "../../../entities/LightGroup.js";

export default class HueLightGroup extends LightGroup {
    constructor({bridgeApi, hueObject, uniqueId, groupId, identifier="MyHueLight", integration, groupedLight, hueScenes}={}){
        super({uniqueId: uniqueId, identifier: identifier, nativeObject: hueObject, configuration: {}});
        this.uniqueId = uniqueId;
        this.groupId = groupId;
        this.bridgeApi = bridgeApi;

        this.integration = integration;
        this.services = hueObject.services;
        this.grouped_light = groupedLight;
        this.hueScenes = hueScenes;

        this.state = this.parseHueToState();
    }

    parseHueToState(hueObject = this.nativeObject){
        return this.grouped_light.state;
    }

    parseStateFromGroupedLight(){
        return this.grouped_light.state;
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

    getService(rtypeName = undefined) {
        if(rtypeName) {
            const service = this.hueObject.services.findOne(service => service.rtype === rtypeName);
            return service;
        }
        else return undefined;
    }

    async setState(state){
        // this.state = Object.assign(this.state, state);
        // // we use rooms service to set state of lights in this room

        return this.grouped_light.setState(state);
        // this.bridgeApi.setGroupedLightState(this.grouped_light, this.parseStateChangeToHue(state));
    }

    async getState(){
        this.internalState = await this.grouped_light.getState();
        this.state = this.parseStateFromGroupedLight();
        return this.state;
    }

    async on(){
        return this.setState({on: true})
    };
    async off(){
        return this.setState({on: true})
    };
    async toggle(){
        //get current state
        let state = await this.getState();

        return this.setState({on: !state.on})
    };

    async setScene(sceneId){
        return this.bridgeApi.activateScene(sceneId);
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
}