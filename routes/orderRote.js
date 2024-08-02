const express = require("express");
const tcon = require("../controllers/OrderCon");

const router = express.Router();

router.route("/").get(tcon.getAllOrder);

module.exports = router;
