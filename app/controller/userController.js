const { default: mongoose } = require("mongoose");
const { getCache, setCache } = require("../../services/redisservice")
const foodModel = require("../model/foodModel")
const RestaurantSchema = require("../model/RestaurantModel/restaurantModel");

class UserController {

   async userfoodlist(req, res) {
    try {
        const { search = "" } = req.query;

        const cachekey = search
            ? `foods:search:${search.toLowerCase()}`
            : "foods";

        const cacheFoods = await getCache(cachekey);

        if (cacheFoods) {
            return res.status(200).json({
                success: true,
                fromCache: true,
                message: "Food list fetched successfully.",
                data: cacheFoods.data,
            });
        }

        const filter = {
            isDeleted: false,
            isAvailable: true,
            approvalStatus: "approved",
        };

        if (search.trim()) {
            filter.itemName = {
                $regex: search.trim(),
                $options: "i",
            };
        }

        const foods = await foodModel
            .find(filter)
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

    async userRestaurantFoodList(req, res) {
        try {
            const { restaurantId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid restaurant ID",
                });
            }

            const restaurant = await RestaurantSchema.findOne({
                _id: restaurantId,
                status: "approved",
            }).select(
                "restaurantName location outletType workingDays openingClosing isOpen status"
            );

            if (!restaurant) {
                return res.status(404).json({
                    success: false,
                    message: "Restaurant not found or not approved",
                });
            }

            const cachekey = `foods:restaurant:${restaurantId}`;

            const cacheFoods = await getCache(cachekey);

            if (cacheFoods) {
                return res.status(200).json({
                    success: true,
                    fromCache: true,
                    message: "Restaurant food list fetched successfully.",
                    data: cacheFoods.data,
                });
            }

            const foods = await foodModel
                .find({
                    restaurant: restaurantId,
                    isDeleted: false,
                    isAvailable: true,
                    approvalStatus: "approved",
                })
                .populate(
                    "restaurant",
                    "restaurantName location status"
                )
                .sort({ createdAt: -1 });

            const response = {
                restaurant: restaurant,
                foods: foods,
            };

            await setCache(cachekey, response, 60);

            return res.status(200).json({
                success: true,
                fromCache: false,
                message: "Restaurant food list fetched successfully.",
                ...response,
            });

        } catch (err) {
            console.error(
                "User Restaurant Food List Error:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: err.message,
            });
        }
    }

}


module.exports = new UserController()