import Service from "./Service.js";
import db from '../schemes/mongo.js';
import Entity from "../entities/Entity.js";
const DbEntity = db.Entity;

export default class EntityService extends Service {
    constructor() {
        super();
        this.entities = [];
        this.name = "EntityService";
    }

    initFunc() {
        let self = this;
        console.log("Initializing EntityService...");
        return new Promise(function (resolve, reject) {
            resolve();
        })
    }

    /**
     *
     * @param sensor {Sensor}
     * @returns {Promise<unknown>}
     */
    addEntity(sensor) {
        return new Promise((resolve, reject) => {
            console.log("not implemented.")
            reject();
        })
    }

    /**
     * @param {String} id
     * @returns {Entity | undefined}
     */
    findEntityById(id) {
        return this.entities.find(entity => entity.id.toString() === id.toString());
    }

    /**
     *
     * @param {String} uniqueId
     * @returns {Entity | undefined}
     */
    findEntityByUniqueId(uniqueId) {
        return this.entities.find(entity => entity.uniqueId === uniqueId);
    }
}
