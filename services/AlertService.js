import Service from "./Service.js";
import Alert from "../classes/Alerts/Alert.js";
import AlertExecutionContext from "../classes/Alerts/AlertExecutionContext.js";

class AlertService extends Service {

    static types = {
        RED: "RED",
        YELLOW: "YELLOW",
        INTRUDER: "INTRUDER",
        LIFESUPPORT: "LIFESUPPORT",
        NUTRITION: "NUTRITION",
    }

    constructor() {
        super();
        this.isAlertActive = false;
        this.activeAlert = undefined;
        this.activeContext = undefined;

        /**
         *
         * @type {Alert[]}
         */
        this.alerts = [];
        this.alertsByType = {};
        this.log = [];
    }

    async initFunc(){
        const red = new Alert({identifier: "redAlert", name: "Red Alert", type: AlertService.types.RED, priority: 99});
        await red.loadFromDb();
        this.alerts.push(red);
        const yellow = new Alert({identifier: "yellowAlert", name: "Yellow Alert", type: AlertService.types.YELLOW, priority: 3});
        await yellow.loadFromDb();
        this.alerts.push(yellow);
        const intruder = new Alert({identifier: "intruderAlert", name: "Intruder Alert", type: AlertService.types.INTRUDER, priority: 4});
        await intruder.loadFromDb();
        this.alerts.push(intruder);
        return true;
    }

    getAll(){
        return this.alerts;
    }

    add(data){

    }

    update(identifier, data={}){
        return new Promise((resolve, reject) => {
            const alert = this.getByIdentifier(identifier);
            if(!alert){
                reject("No matching alert found.");
            }
            else {
                alert.update(data)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    remove(id){

    }

    activate(alert){
        let activated = false;
        return new Promise((resolve, reject) => {
            if(!alert) reject("Invalid arguments received");
            //check for active alerts
            const context = this.activeContext;
            if(context && !context.state === AlertExecutionContext.STATE.FINISHED){
                const activeAlert = context.getAlert();
                //check priority
                if(activeAlert.priority < alert.priority){
                    context.stop({
                        reason: "OVERRIDE"
                    });
                    const ecPromise = activateAlert(this, alert);
                    resolve(ecPromise);
                }
                else {
                    reject("Not allowed");
                }
            }
            else {
                const ecPromise = activateAlert(this, alert);
                resolve(ecPromise);
            }

            function activateAlert(self, alert){
                //create exec context
                const ec = new AlertExecutionContext(alert);
                return ec.run();
            }
        })
    }

    getActiveAlert(){
        return this.activeAlert;
    }

    setActiveAlert(alert){
        this.activeAlert = alert.identifier;
    }
    activateByType(type){
        const alert = this.getByType(type);
        let activated = false;
        if(alert) {
            return this.activate(alert);
        }
        return false;
    }

    deactivate(type){
        const alert = this.getByType(type);
        if(alert.isActive()){
            alert.deactivate();
        }
    }

    /**
     *
     * @param type
     * @returns {Alert}
     */
    getByType(type){
        return this.alerts.find(alert => alert.type === type);
    }

    getByIdentifier(identifier){
        return this.alerts.find(alert => alert.identifier === identifier);
    }

    deactivateAll(){
        this.alerts.forEach(alert => {
            alert.deactivate();
        })
        return true;
    }

    getActiveAlerts() {
        this.alerts.filter(alert => alert.isActive());
    }


    setPriority(identifier, priority){
        return new Promise((resolve, reject) => {
            const alert = this.getByIdentifier(identifier);
            if(!alert){
                reject("No matching alert found.");
            }
            else {
                alert.setProperties(priority)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    setProperties(identifier, properties){
        return new Promise((resolve, reject) => {
            const alert = this.getByIdentifier(identifier);
            if(!alert){
                reject("No matching alert found.");
            }
            else {
                alert.setProperties(properties)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    addAction(identifier, actionData, phaseIndex){
        return new Promise((resolve, reject) => {
            const alert = this.getByIdentifier(identifier);
            if(!alert){
                reject("No matching alert found.");
            }
            else {
                alert.addAction(actionData, phaseIndex)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    updateAction(identifier, actionId, actionData){
        return new Promise((resolve, reject) => {
            const alert = this.getByIdentifier(identifier);
            if(!alert){
                reject("No matching alert found.");
            }
            else {
                alert.updateAction(actionId, actionData)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    removeAction(identifier, actionId){
        return new Promise((resolve, reject) => {
            const alert = this.getByIdentifier(identifier);
            if(!alert){
                reject("No matching alert found.");
            }
            else {
                alert.removeAction(actionId)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    addPhase(identifier){
        return new Promise((resolve, reject) => {
            const alert = this.getByIdentifier(identifier);
            if(!alert){
                reject("No matching alert found.");
            }
            else {
                alert.addPhase()
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    /**
     * removes the phase with highest index
     * @param identifier
     */
    removePhase(identifier){
        const errMsg = "AlertService: Failed to remove Phase: "
        const alert = this.getByIdentifier(identifier);
        if(!alert){
            throw new Error(errMsg + "No matching alert found.");
        }
        else {
            return alert.removePhase();
        }
    }

    removePhaseById(identifier, phaseId){
        return new Promise((resolve, reject) => {
            const alert = this.getByIdentifier(identifier);
            if(!alert){
                reject("No matching alert found.");
            }
            else {
                alert.removePhaseById(phaseId)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }



    async updatePhase(identifier, phaseIndex, data){
        const errMsg = "AlertService: Failed to update Phase: "
        const alert = this.getByIdentifier(identifier);
        if(!alert){
            throw new Error(errMsg + "No matching alert found.");
        }
        else {
            const duration = data.duration;
            return this.setPhaseDuration(identifier, phaseIndex, duration);
        }

    }

    /**
     *
     * @param identifier alert identifier
     * @param phaseIndex phase index
     * @param duration phase duration in milliseconds
     */
    setPhaseDuration(identifier, phaseIndex, duration){
        return new Promise((resolve, reject) => {
            const alert = this.getByIdentifier(identifier);
            if(!alert){
                reject("No matching alert found.");
            }
            else {
                alert.setPhaseDurationByIndex(phaseIndex, duration)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }
}

export default new AlertService();