const jwt = require("jsonwebtoken");
const RestaurantSchema = require("../model/RestaurantModel/restaurantModel");

const AuthCheck = async (req, res, next) => {

  try {

    const authHeader = req.headers.authorization;


    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: false,
        message: "Access denied"
      });
    }


    const token = authHeader.split(" ")[1];


    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "sagnikduttawebskitters"
    );


    req.user = {
      id: decoded.id,
      role: decoded.role,
    };



    // Restaurant find
    const restaurant =
      await RestaurantSchema.findOne({
        owner: decoded.id
      });



    if (!restaurant) {

      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });

    }



    req.restaurant = restaurant;


    next();


  } catch (err) {

    return res.status(401).json({
      success: false,
      message: err.message
    });

  }

};


module.exports = AuthCheck;