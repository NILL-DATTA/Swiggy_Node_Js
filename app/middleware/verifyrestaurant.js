
const RestaurantSchema = require("../model/RestaurantModel/restaurantModel");


const verifyRestaurant = async (req, res, next) => {

    try {

        const restaurant = await RestaurantSchema.findOne({
            owner: req.user.id
        });
        // console.log(restaurant, "restaurant")
        if (!restaurant) {
            return res.status(404).json({
                status: false,
                message: "Restaurant not found"
            });
        }

        req.restaurant = restaurant;

        next();
    } catch (err) {
        return res.status(401).json({
            status: false,
            message: "Invalid or expired token",
        });
    }

}
module.exports = verifyRestaurant;
