import db from '../schemes/mongo.js';
const Logs = db.Logs;

class LogService {

    constructor(){
        this.serviceName = "LogService"
    }

    async getAll(){
        let result = await Logs.find().lean().exec();
        return result;
    }

    addLogEntry(type, message, details="", additionalData={}){
        let log = new Logs({
            type: type,
            message: message,
            details: details,
        });
        return log.save()
            .then(result=>{
                console.log("Log saved.");
            })
            .catch(err => {
                console.log("Failed to save log: " + err);
            })
    }

    /**
     *
     * @param {Client} client
     * @param {VoiceCommandProcessingResult} processingResult
     */
    logCommandResult(client, processingResult) {
        if(processingResult.error === undefined) {
            return this.addLogEntry(this.types.COMMAND, `Successfully processed command obtained from client: ${client.identifier}`, `Intent: ${processingResult.intent}, \n Slots: ${JSON.stringify(processingResult.slots)}`)
        }
        else {
            return this.addLogEntry(this.types.COMMAND, `Failed to process command. Reason: ${processingResult.error}`, `Client: ${client.identifier}, \n Intent: ${processingResult.intent}, \n Slots: ${JSON.stringify(processingResult.slots)} \n Error: ${processingResult.error}`)
        }
    }

    types = {
        INFO: "INFO",
        WARNING: "WARNING",
        ERROR: "ERROR",
        STATUS: "STATUS",
        COMMAND: "COMMAND",
    }
}

export default new LogService();
