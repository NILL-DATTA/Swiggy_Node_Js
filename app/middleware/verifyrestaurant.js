
const RestaurantSchema = require("../model/RestaurantModel/restaurantModel");


const verifyRestaurant = async (req, res, next) => {
console.log("verifyRestaurant")
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
        console.log("User ID:", req.user.id);
        console.log("Restaurant From DB:", restaurant);

        next();
    } catch (err) {
        return res.status(401).json({
            status: false,
            message: "Invalid or expired token",
        });
    }

}
module.exports = verifyRestaurant;
