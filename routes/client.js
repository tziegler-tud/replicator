var express = require('express');
var router = express.Router();

const ClientService = require("./ClientService");
const clientService = ClientService.getInstance();


//router for client interaction
/* hooked at /api/v1/client */

/* GET users listing. */
router.post('/register', function(req, res, next) {
    let data = req.body;
    clientService.registerClient(data)
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            next(err);
        })
});

module.exports = router;