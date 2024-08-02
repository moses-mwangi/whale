const express = require("express");
const tcon = require("../controllers/TourController");

const router = express.Router();

router.route("/").get(tcon.getAllTour);

module.exports = router;
