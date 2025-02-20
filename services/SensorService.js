import db from '../schemes/mongo.js';
import EntityService from "./EntityService.js";
const DbSensor = db.Sensor;

class SensorService extends EntityService {
    constructor() {
        super();
        this.sensors = [];
        this.name = "SensorService"
    }

    /**
     *
     * @param sensor {Sensor}
     * @returns {Promise<unknown>}
     */
    addSensor(sensor) {
        return new Promise((resolve, reject) => {
            //check if a matching light is present in db
            DbSensor.findOne({uniqueId: sensor.uniqueId})
                .then(settings => {
                    if (settings) {
                        sensor.loadSettings(settings);
                        this.sensors.push(sensor);
                        resolve(sensor);
                    } else {
                        //create a new light and save to db
                        const sensorSettings = {
                            uniqueId: sensor.uniqueId,
                            identifier: sensor.identifier,
                        }
                        let dbSensor = new DbSensor(sensorSettings);
                        dbSensor.save()
                            .then(result => {
                                sensor.loadSettings(result)
                                this.sensors.push(sensor);
                                resolve(sensor)
                            })
                    }
                })
        })
    }

    getSensors(json= false){
        let p = [];
        this.sensors.forEach(sen => {
            p.push(json ? sen.getJson() : sen.get());
        })
        return p;
    }

    /**
     * @param {String} id
     * @returns {Entity | undefined}
     */
    findSensorById(id) {
        return this.entities.find(entity => entity.id.toString() === id.toString());
    }

    /**
     *
     * @param {String} uniqueId
     * @returns {Entity | undefined}
     */
    findSensorByUniqueId(uniqueId) {
        return this.entities.find(entity => entity.uniqueId === uniqueId);
    }
}
export default new SensorService();