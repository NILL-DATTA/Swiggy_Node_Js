const Joi = require("joi");

const addFoodValidate = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),

  price: Joi.number().positive().required(),

  category: Joi.string().trim().required(),

  restaurantId: Joi.string().hex().length(24).required(),

  description: Joi.string().allow("").optional(),
});

module.exports = {
  addFoodValidate,
};
