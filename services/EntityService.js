import Service from "./Service.js";

export default class EntityService extends Service {
    constructor() {
        super();
        this.entities = [];
        this.name = "EntityService";
        this.serviceName = "EntityService";
    }

    initFunc() {
        let self = this;
        return new Promise((resolve, reject) =>  {
            resolve();
        })
    }

    /**
     *
     * @param entity {Entity}
     * @returns {Promise<unknown>}
     */
    addEntity(entity) {
        return new Promise((resolve, reject) => {
            this.entities.push(entity);
            resolve(entity);
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

    /**
     *
     * @param {Boolean} json - return json representation
     * @returns {Entity[]}
     */
    getEntities(json= false){
        return this.entities
    }
}
