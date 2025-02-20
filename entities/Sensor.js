import Entity from "./Entity.js";

/**
 * @class Sensor
 */
export default class Sensor extends Entity {
    constructor({uniqueId, identifier= "NewDefaultSensor", nativeObject={}, configuration={}}={}){
        let defaultConfiguration = {

        }
        super({uniqueId, identifier, nativeObject, configuration});
        this.state = {
            value: 0,
            reachable: false,
            unit: "none",
            color: {},
        };
    }
}