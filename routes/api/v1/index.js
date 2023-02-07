import express from 'express';
var router = express.Router();

router.get("/", apiIndex)

function apiIndex(req, res, next){
  res.json("Replicator backend api");
}

export default router;
