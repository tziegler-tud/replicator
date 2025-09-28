import express from 'express';
var router = express.Router();
import MODULES from "./modules.js";
import LogService from "../../services/LogService.js";

/**
 * hooked at /log
 */

router.get("/", log)
// router.get("/:identifier", logDetails)

async function log(req, res, next){

    //get clients
    const logEntries = await LogService.getAll();
    res.render("log/all", {
        logEntries: logEntries,
        test: "test",
        page: {
            modules: [
                MODULES.Log,
            ],
            nav: {
                currentEntry: "log"
            },
            logEntries: logEntries,
        }
    });
}

export default router;
