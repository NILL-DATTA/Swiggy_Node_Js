const { getCache, setCache } = require("../../services/redisservice")
const foodModel = require("../model/foodModel")
const RestaurantSchema = require("../model/RestaurantModel/restaurantModel");

class UserController {

    async userfoodlist(req, res) {
        try {
            const cachekey = "foods";

            // Check cache
            const cacheFoods = await getCache(cachekey);

            if (cacheFoods) {
                return res.status(200).json({
                    success: true,
                    fromCache: true,
                    message: "Food list fetched successfully.",
                    data: cacheFoods.data,
                });
            }

            const foods = await foodModel
                .find({
                    isDeleted: false,
                    isAvailable: true,
                    approvalStatus: "approved",
                })
                .populate(
                    "restaurant",
                    "restaurantName location status"
                );

            const response = {
                data: foods,
            };

            await setCache(cachekey, response, 60);

            return res.status(200).json({
                success: true,
                fromCache: false,
                message: "Food list fetched successfully.",
                ...response,
            });
        } catch (err) {
            console.error("User Food List Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }

    async userRestaurantList(req, res) {
        try {
            const cacheKey = "restaurants";

            // Check cache
            const cacheRestaurants = await getCache(cacheKey);

            if (cacheRestaurants) {
                return res.status(200).json({
                    success: true,
                    fromCache: true,
                    message: "Restaurant list fetched successfully.",
                    data: cacheRestaurants.data,
                });
            }

            // Get only approved restaurants
            const restaurants = await RestaurantSchema.find({
                status: "approved",
            }).select(
                "restaurantName location outletType workingDays openingClosing isOpen status"
            );

            const response = {
                data: restaurants,
            };

            // Cache for 60 seconds
            await setCache(cacheKey, response, 60);

            return res.status(200).json({
                success: true,
                fromCache: false,
                message: "Restaurant list fetched successfully.",
                ...response,
            });
        } catch (err) {
            console.error("User Restaurant List Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }

}


module.exports = new UserController()