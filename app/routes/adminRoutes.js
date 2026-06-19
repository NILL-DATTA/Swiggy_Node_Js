const express = require("express");

const router = express.Router();
const adminController = require("../controller/adminController");

router.put(
  "/admin/update-restaurant/:id",
  adminController.updateRestaurantStatus,
);


router.patch("/applications/:id/approve", adminController.approveApplication)
module.exports = router;
