const express = require("express");

const router = express.Router();
const adminController = require("../controller/adminController");

router.put(
  "/admin/update-restaurant/:id",
  adminController.updateRestaurantStatus,
);

module.exports = router;
