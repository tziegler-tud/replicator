
/**
 * @class Light
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
        };
        let defaultConfiguration = {
            brightness: {
                max: 254,
                min: 0,
            }
        }
        this.configuration = Object.assign(defaultConfiguration, configuration);
        this.nativeObject = nativeObject;
        this.settings = {
            identifier: identifier,
        };
        this.properties = {};
    }

    parseState(state){
        //parse an object to the target state
        return {
            on: state.on,
            brightness: state.brightness,
            hue: state.hue,
            sat: state.sat,
            reachable: state.reachable,
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

    getState(){
        return this.state;
    }

    setState(state){
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

    setBrightnessAbsolute(val){
        return this.setState({brightness: this.normalizeBrightness(val)});
    }
    setBrightnessRelative(val){
        const current = this.getState().brightness;
        const updatedVal = updatedVal+ current;
        return this.setState({brightness: this.normalizeBrightness(updatedVal)});
    }

    setColor({h,s,v}){
        this.setState({
            hue: h,
            sat: s,
            brightness: v,
        })
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
     * @param percent {String|Number} percent value, potentially a string with % at the end
     * @param [max] {Number} maximum brightness used for normalizing. Defaults to the objects configuration
     * @param [min] {Number} minimum brightness used for normalizing. Defaults to the objects configuration
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
     * @param brightness {Number|String}
     * @param [max] {Number} maximum brightness used for normalizing. Defaults to the objects configuration
     * @param [min] {Number} minimum brightness used for normalizing. Defaults to the objects configuration
     * @returns {Integer}
     */
    normalizeBrightness(brightness, max=this.configuration.brightness.max, min=this.configuration.brightness.min) {
        brightness = parseInt(brightness);
        if (brightness > max) return max;
        if (brightness < min) return min;
        return brightness
    }
}