import Sensor from "../../../entities/Sensor.js";
/**
 * @typedef DeconzNativeSensor
 * @property {string} etag
 * @property {string} manufacturer
 * @property {string} modelid
 * @property {string} name
 * @property {string} swversion
 * @property {string} type - ZHATemperature | ZHAHumidity
 * @property {string} uniqueid
 * @property {DeconzNativeSensorState} state
 */

/**
 * @typedef DeconzNativeSensorState
 * @property {string} lastupdated
 * @property {string} temperature
 * @property {string} humidity
 */

/**
 * @class DeconzSensor
 * @property {String} uniqueId
 * @property {String} identifier
 * @property {String} sensorId
 * @property {DeconzNativeSensor} nativeObject
 * @property {DeconzBridgeApi} bridgeApi
 * @property {SensorState} state
 */

export default class DeconzSensor extends Sensor {

    /**
     * @constructor
     * @param {DeconzBridgeApi} bridgeApi
     * @param nativeObject {DeconzNativeSensor}
     * @param {string} uniqueId
     * @param {string} sensorId
     * @param {string} identifier
     * @param integration
     */
    constructor({bridgeApi, nativeObject, uniqueId, sensorId, identifier="MyDeconzSensor", integration}={}){
        super({uniqueId: uniqueId, identifier: identifier, nativeObject: nativeObject, configuration: {}});

        this.deconzId = sensorId;
        this.sensorId = sensorId;
        /**
         * @type {DeconzBridgeApi}
         */
        this.bridgeApi = bridgeApi;
        this.state = this.parseNativeToState(nativeObject);
        this.integration = integration;
        /**
         *
         * @type {DeconzNativeSensor}
         */
        this.nativeObject = nativeObject;
    }

    /**
     *
     * @param nativeObject {DeconzNativeSensor}
     * @returns {SensorState}
     */
    parseNativeToState(nativeObject){
        let value = 0;
        let unit = "";
        let unit_name =  "";
        switch(nativeObject.type) {
            case "ZHATemperature":
                value = nativeObject.state.temperature / 100;
                unit = Sensor.UNITS.DEGREE_CELCIUS.unit;
                unit_name = Sensor.UNITS.DEGREE_CELCIUS.name
                break;
            case "ZHAHumidity":
                value = nativeObject.state.humidity / 100;
                unit = Sensor.UNITS.PERCENT.unit;
                unit_name = Sensor.UNITS.PERCENT.name
                break;
            default:
                break;
        }

        return {
            value: value,
            unit: unit,
            unit_name: unit_name,
            last_updated: nativeObject.state.lastupdated
        }
    }

    /**
     *
     * @param nativeObject {DeconzNativeSensor}
     * @returns {SensorState}
     */
    parseNativeChangeToState(nativeObject){
        let stateChange = Object.assign(this.nativeObject, nativeObject);
        return this.parseNativeToState(stateChange)

    }


    /**
     *
     * @param state
     * @returns {Promise<void>}
     */
    async setState(state){
    }

    /**
     *
     * @returns {Promise<SensorState>}
     */
    async getState(){
        this.nativeObject = await this.bridgeApi.getSensorState(this.sensorId);
        this.state = this.parseNativeToState(this.nativeObject);
        return this.state;
    }


    getInternalState(){
        return this.state;
    }
    setInternalState(nativeObject){
        this.state = this.parseNativeChangeToState(nativeObject);
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