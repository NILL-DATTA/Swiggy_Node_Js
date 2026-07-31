const { getCache, setCache } = require("../../services/redisservice")
const foodModel = require("../model/foodModel")

class UserController {

    async userfoodlist(req, res) {
        try {
            const cachekey = "foods"

            const cacheFoods = await getCache(cachekey)

            if (cacheFoods) {
                return res.status(200).json({
                    success: true,
                    fromCache: true,
                    message: "Food list fetched successfully.",
                    data: cacheFoods.data,
                })
            }

            const foods = await foodModel.find({
                isDeleted: false,
                isAvailable: true,
            }).populate("restaurant", "restaurantName location status")


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
            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }

}


module.exports = new UserController()