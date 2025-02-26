import DeconzEvent from "./DeconzEvent.js";
import WebSocket from "ws";

export default class EventStreamHandler {
    /**
     *
     * @param {DeconzIntegration} integration
     */
     constructor(integration, host, port){
        this.integration = integration;
        this.host = host;
        this.port = port;


        const ws = new WebSocket('ws://' + this.host + ':' + this.port);

        ws.onmessage = (msg) => {
            if(msg.data === undefined) {
                console.log("DeconzIntegration: EventHandler received empty message. Aborting...");
                return;
            }
            const data = JSON.parse(msg.data);
            switch(data.t){
                case "event":
                    const event = new DeconzEvent(data);
                    this.handle(event);
            }
        }
    }

    /**
     *
     * @param {DeconzEvent} event
     */
    handle(event){
        switch(event.event){
            case "added":
                return this.addEvent(event);
            case "changed":
                return this.updateEvent(event);
            case "deleted":
                return this.deleteEvent(event);
            case "scene-called":
            default:
                return this.log(event);
        }
    }
    log(event){
        console.log("DeconzIntegration: Received message: Type: " + event.event + " data: " + event.toString());
    }

    /**
     *
     * @param {DeconzEvent} deconzEvent
     */
    addEvent(deconzEvent){
        console.log("DeconzIntegration: something was added!");
    }

    /**
     *
     * @param {DeconzEvent} deconzEvent
     */
    updateEvent(deconzEvent){
        const self = this;
        //identify updated resource type
        switch(deconzEvent.resource){
            case "groups":
                const group = this.integration.getGroup(deconzEvent.id);
                if(group === undefined || deconzEvent.state === undefined) return false;
                //update group state
                group.setInternalState({state: deconzEvent.state})
                break;
            case "lights":
                const light = this.integration.getLight(deconzEvent.id);
                if(light === undefined || deconzEvent.state === undefined) return false;
                //update group state
                light.setInternalState({state: deconzEvent.state})
                break;
            case "scenes":
                break;
            case "sensors":
                const sensor = this.integration.getSensor(deconzEvent.id);
                if(sensor === undefined || deconzEvent.state === undefined) return false;
                //update group state
                sensor.setInternalState({state: deconzEvent.state})
                break;
        }

        console.log("DeconzIntegration: A resources of type " + deconzEvent.resource + " was updated!")
    }
    deleteEvent(deconzEvent){
        console.log("DeconzIntegration: something was deleted!")
        // return this.integration.reload();
    }
    errorEvent(deconzEvent){
        console.log("DeconzIntegration: Error received:");
        this.log(deconzEvent);

    }
}