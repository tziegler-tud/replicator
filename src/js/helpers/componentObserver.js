export default class ComponentObserver {
    constructor(events, notifyFunc) {
        if(events.length === 0 || events === "all") {
            events = ["all"];
        }
        if(!Array.isArray(events)){
            events = [events]
        }
        this.events = events;
        this.notifyFunc = notifyFunc
    }

    inform({event, data}){
        if(this.events.includes("all") || this.events.includes(event)){
            this.notifyFunc(event, data);
        }
    }
}