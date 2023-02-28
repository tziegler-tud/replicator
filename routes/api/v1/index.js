import express from 'express';
var router = express.Router();

/**
 * hooked at /api
 */
router.get("/", apiIndex)

function apiIndex(req, res, next){
  res.json("Replicator backend api");
}

export default router;
