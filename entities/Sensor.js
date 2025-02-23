import Entity from "./Entity.js";

/**
 * @class SensorState
 * @property {number} value
 * @property {String} unit
 * @property {String} unit_name
 * @property {String} last_updated
 * @property {Boolean} reachable
 *
 */

/**
 * @class Sensor
 * @property {string} sensorId
 * @property {SensorState} state
 */
export default class Sensor extends Entity {


    static UNITS = {
        DEGREE_CELCIUS: {
            unit: "°C",
            name: "Degree Celcius"
        },
        PERCENT: {
            unit: "%",
            name: "Percent",
        }
    }


    constructor({uniqueId, identifier= "NewDefaultSensor", nativeObject={}, configuration={}}={}){
        let defaultConfiguration = {

        }
        super({uniqueId, identifier, nativeObject, configuration});
        this.state = {
            value: 0,
            reachable: false,
            unit: "none",
            unit_name: "none",
            last_updated: undefined,
        };
    }
}