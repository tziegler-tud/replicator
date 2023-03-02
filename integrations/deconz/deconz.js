import https from 'https';
import http from 'http';
import Integration from "../Integration.js";
import LightsService from "../../services/LightsService.js";

export default class DeconzIntegration extends Integration {
    constructor({BridgeUrl, BridgeUser} = {}) {
        super();
        this.readableName = "Deconz Api Integration"
        this.integration = {
            type: "Deconz",
            data: {}
        }
        this.locations = [];
        this.lights = [];

        this.BridgeUrl = BridgeUrl;
        this.BridgeUser = BridgeUser;
        this.initStarted = false;

    }

    async initFunc({BridgeUrl, BridgeUser}) {
        let self = this;
        if (BridgeUrl) this.BridgeUrl = BridgeUrl;
        if (BridgeUser) this.BridgeUser = BridgeUser;
        const errMsg = "Failed to load " + this.readableName + ": ";
        console.log("Loading " + this.readableName + "...");
        // this.BridgeUrl = "192.168.1.102";
        this.Bridge = undefined;
        //TODO: implement integration

        console.log(errMsg + "not implemented")
        return true;
    }
}