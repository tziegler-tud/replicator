import tcpResponse from "./tcpResponseGenerator.js";

/**
 * @class
 * @constructor
 * @param message {String} error message.
 * @param status {Number} error status code.
 * @param errName {String} error name
 * @param errCode {Number} error code
 */

export default class TcpError extends Error {
    constructor(tcpResponse){
        super(tcpResponse.message)
        /**
         *
         * @type {boolean}
         */
        this.tcpError = true;

        /**
         * @type {Number}
         */
        this.status = tcpResponse.status;
        this.errorCode = tcpResponse.code;
        this.data = tcpResponse;
    }
}