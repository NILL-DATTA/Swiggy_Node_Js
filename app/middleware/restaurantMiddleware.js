const restaurantOwner = (req, res, next) => {
    if (req.user.role !== "restaurant_owner") {
        return res.status(403).json({
            status: false,
            message: "Access denied. Restaurant owners only.",
        });
    }

    next();
};

module.exports = {
    restaurantOwner,
};