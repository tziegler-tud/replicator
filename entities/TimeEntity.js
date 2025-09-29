import Entity from "./Entity.js";

export default class TimeEntity extends Entity {
    constructor({identifier = "Time", nativeObject = {}, configuration = {}} = {}) {
        super({
            uniqueId: "internal_time",
            identifier,
            nativeObject,
            configuration
        });

        this.state = {
            time: this.getTime()
        }
    }

    /**
     *
     * @returns {Promise<Object>}
     */
    async getState(){
        this.state = {
            time: this.getTime()
        }
        return this.state;
    }

    getTime(includeSeconds = false){
        const d = new Date();
        let hours = _ensureTwoDigits(d.getHours())
        let minutes = _ensureTwoDigits(d.getMinutes())
        let seconds = _ensureTwoDigits(d.getSeconds())
        return includeSeconds? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;

        function _ensureTwoDigits(number){
            return (number.toString().length === 1) ? "0" + number : number
        }
    }
}
