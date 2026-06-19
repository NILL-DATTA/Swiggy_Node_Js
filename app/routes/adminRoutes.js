const express = require("express");

const router = express.Router();
const adminController = require("../controller/adminController");

router.put(
  "/admin/update-restaurant/:id",
  adminController.updateRestaurantStatus,
);


router.patch("/applications/:id/approve", adminController.approveApplication)
router.patch("/applications/:id/reject", adminController.rejectedApplication)

module.exports = router;
