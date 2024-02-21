export default class HueEvent{
    constructor(eventData){
        this.id = eventData.id;
        this.type = eventData.type;
        this.data = eventData.data;
        this.creationTime = eventData.creationTime;
    }

    getModifiedResources(){
        let resources = [];
        this.data.forEach(dataset => {
            resources.push({
                type: dataset.type,
                uniqueId: dataset.id,
                data: dataset,
            });
        })
        return resources;
    }
}