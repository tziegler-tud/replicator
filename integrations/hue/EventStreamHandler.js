import HueEvent from "./HueEvent.js";

export default class EventStreamHandler {
    constructor(integration){
        this.integration = integration;
    }
    add(event){
        this.log(event)
    }
    update(event){
        this.log(event)
    }
    delete(event){
        this.log(event)
    }
    error(event){
        this.log(event)
    }
    message(event){
        // this.log(event);
        const data = JSON.parse(event.data);
        data.forEach(event => {
            let hueEvent = new HueEvent(event);
            switch(hueEvent.type){
                case "add":
                    return this.addEvent(hueEvent);
                case "update":
                    return this.updateEvent(hueEvent);
                case "delete":
                    return this.deleteEvent(hueEvent);
                case "error":
                default:
                    return this.errorEvent(hueEvent);
            }
        })
    }
    log(event){
        console.log("HueIntegration: Received event: Type: " + event.type + " data: " + event.data.toString());
    }

    addEvent(hueEvent){
        console.log("HueIntegration: something was added!");
    }
    updateEvent(hueEvent){
        const self = this;
        //identify updated resources
        const modifiedResources = hueEvent.getModifiedResources();
        //get resources
        if(modifiedResources.length > 0){
            console.log("HueIntegration: "+ modifiedResources.length + " resources were updated!")
            modifiedResources.forEach(resource => {
                let entity = self.integration.getResource(resource.uniqueId);
                if(entity) {
                    entity.setInternalState(resource.data)
                }
            })
        }
    }
    deleteEvent(hueEvent){
        console.log("HueIntegration: something was deleted!")
        // return this.integration.reload();
    }
    errorEvent(hueEvent){
        console.log("HueIntegration: Error received:");
        this.log(hueEvent);

    }
}