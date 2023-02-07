/**
 * @class
 * @constructor
 * @param message {String} error message.
 * @param status {Number} error status code.
 * @param errName {name} error name
 */

export default class ApiError extends Error {
    constructor(message, status, errName){
        super(message)
        /**
         *
         * @type {boolean}
         */
        this.apiError = true;

        /**
         * @type {Number}
         */
        this.status = status;

        /**
         * @type {String}
         */
        this.errName = errName;

        if(!errName) {
            //auto-generate
            this.errName = this.generateErrorName();
        }
    }

    generateErrorName(){
        let name = "General Error";
        switch(this.status.toString()){
            case "400":
                name = "ValidationError"
                break;
            case "401":
                name = "UnauthorizedError"
                break;
            case "402":
                name = "ForbiddenError"
                break;
            case "404":
                name = "NotFoundError";
                break;
            default:
            case "500":
                name = "InternalServerError"
                break;
        }
        return name;
    }

    errorHandlerObject(){
        return {
            name: this.errName,
            status: this.status,
            message: this.message,
        }
    }
}