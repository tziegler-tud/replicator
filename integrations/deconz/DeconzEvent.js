/**
 * @class DeconzEvent
 * @property {string} id
 * @property {string} type
 * @property {string} event
 * @property {string} resource
 * @property {string} uniqueid
 * @property {string} gid
 * @property {string}  sci
 * @property {object}  config
 * @property {string}  name
 * @property {DeconzNativeLightState | DeconzNativeLightGroupState}  state
 * @property {object}  group
 * @property {object}  light
 * @property {object}  sensor
 */
export default class DeconzEvent{
    /**
     * 
     * @param eventData
     */
    constructor(eventData){
        this.id = eventData.id;
        this.type = eventData.t;
        this.event = eventData.e;
        this.resource = eventData.r;
        this.uniqueid = eventData.uniqueid;
        this.gid = eventData.gid;
        this.scid = eventData.scid;
        this.config = eventData.config;
        this.name = eventData.name;
        this.state = eventData.state;
        this.group = eventData.group;
        this.light = eventData.group;
        this.sensor = eventData.sensor;
    }
}