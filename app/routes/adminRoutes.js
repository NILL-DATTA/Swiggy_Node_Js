const express = require("express");

const router = express.Router();
const adminController = require("../controller/adminController");
const upload = require("../middleware/image");

router.put(
  "/admin/update-restaurant/:id",
  adminController.updateRestaurantStatus,
);
router.patch("/applications/:id/status", adminController.updateApplicationStatus)

router.get(
  "/admin/restaurants/approved",
  adminController.approvedRestaurants
);
router.get(
  "/admin/restaurants/pending",
  adminController.pendingRestaurants
);



module.exports = router;
