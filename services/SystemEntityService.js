import Service from "./Service.js";
import db from '../schemes/mongo.js';
import Entity from "../entities/Entity.js";
import TimeEntity from "../entities/TimeEntity.js";
import EntityService from "./EntityService.js";
const DbEntity = db.Entity;

class SystemEntityService extends EntityService {
    constructor() {
        super();
        this.entities = [];
        this.name = "SystemEntityService";
        this.serviceName = "SystemEntityService";
    }

    async initFunc() {
        let self = this;
        await this.loadBuildInEntities();
        console.log("SystemEntityService started.")
    }

    async loadBuildInEntities(){
        const timeEntity = new TimeEntity();
        await this.addEntity(timeEntity);
    }
}

export default new SystemEntityService()