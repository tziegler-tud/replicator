import db from '../schemes/mongo.js';
const DbLocation = db.Location;
//

class LocationManager {
    constructor(){

    }

    getAll(){
        return DbLocation.find();
    }

    getById(id){
        return DbLocation.findById(id);
    }

    getByVoiceAlias(alias){
        return DbLocation.find({voiceCommandAlias: alias});
    }

    create(locationData){
        const identifier = locationData.identifier;

        return new Promise(function(resolve, reject){
            if(!identifier) reject("invalid arguments received");

            let location = new DbLocation(locationData);
            location.save()
                .then(result=>{
                    resolve(result)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    update(id, locationData){
        return new Promise(function(resolve, reject){

            //retrieve object
            DbLocation.findById(id)
                .then(location => {
                    let updatedLocation = Object.assign(location, locationData);
                    updatedLocation.save()
                        .then(result=>{
                            resolve(result)
                        })
                        .catch(err => {
                            reject(err)
                        })
                })
        })
    }

    /**
     *
     * @param id {ObjectId} location database id
     *
     */
    remove(id){
        let self = this;
        return new Promise(function(resolve, reject){
            //remove from db
            DbLocation.findByIdAndDelete(id)
                .then(result => {
                    resolve(result)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
}

export default new LocationManager();