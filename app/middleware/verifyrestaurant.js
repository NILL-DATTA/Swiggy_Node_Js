const RestaurantSchema = require("../model/RestaurantModel/restaurantModel");

const verifyRestaurant = async (req, res, next) => {

    console.log("VERIFY RESTAURANT V2");

    try {

        const restaurant = await RestaurantSchema.findOne({
            owner: req.user.id
        });

        if (!restaurant) {
            return res.status(404).json({
                status: false,
                message: "Restaurant not found"
            });
        }

        req.restaurant = restaurant;

        console.log("USER ID:", req.user.id);
        console.log("RESTAURANT ID:", restaurant._id);
        console.log("BEFORE NEXT");

        next();

        console.log("AFTER NEXT");

    } catch (err) {

        console.error("VERIFY RESTAURANT ERROR:", err);

        return res.status(401).json({
            status: false,
            message: "Invalid or expired token",
        });
    }
};

module.exports = verifyRestaurant;