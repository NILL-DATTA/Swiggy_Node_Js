const joi = require("joi");

const restaurantValidate = joi.object({
  ownerName: joi.string().trim().required().messages({
    "string.empty": "Owner name is required",
    "any.required": "Owner name is required",
  }),

  restaurantName: joi.string().trim().required().messages({
    "string.empty": "Restaurant name is required",
    "any.required": "Restaurant name is required",
  }),

  location: joi.string().trim().required().messages({
    "string.empty": "Location is required",
    "any.required": "Location is required",
  }),

  email: joi.string().email().required().messages({
    "string.email": "Invalid email address",
    "any.required": "Email is required",
  }),

  phone: joi
    .string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid phone number",
      "any.required": "Phone number is required",
    }),

  whatsappNumber: joi
    .string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid whatsapp number",
      "any.required": "Whatsapp number is required",
    }),

  workingDays: joi
    .array()
    .items(
      joi
        .string()
        .valid(
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ),
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one working day is required",
      "any.required": "Working days are required",
    }),

  openingClosing: joi
    .object({
      sameForAllDays: joi.boolean().required(),

      slots: joi
        .array()
        .items(
          joi.object({
            open: joi.string().required().messages({
              "any.required": "Opening time is required",
            }),

            close: joi.string().required().messages({
              "any.required": "Closing time is required",
            }),
          }),
        )
        .min(1)
        .required(),
    })
    .required(),
});

const restaurantDocumentsValidate = joi.object({
  outletType: joi
    .string()
    .valid("Restaurant", "Cloud Kitchen", "Cafe", "Bakery", "Sweet Shop")
    .required()
    .messages({
      "any.required": "Outlet type is required",
      "any.only": "Invalid outlet type",
    }),

  pan: joi
    .string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .required()
    .uppercase()
    .messages({
      "string.pattern.base": "Invalid PAN number",
      "any.required": "PAN is required",
    }),

  gstin: joi
    .string()
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .required()
    .uppercase()
    .messages({
      "string.pattern.base": "Invalid GSTIN",
      "any.required": "GSTIN is required",
    }),

  ifscCode: joi
    .string()
    .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .required()
    .uppercase()
    .messages({
      "string.pattern.base": "Invalid IFSC code",
      "any.required": "IFSC code is required",
    }),

  bankAccountNumber: joi
    .string()
    .pattern(/^[0-9]{9,18}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid bank account number",
      "any.required": "Bank account number is required",
    }),

  fssaiNumber: joi
    .string()
    .pattern(/^[0-9]{14}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid FSSAI certificate number",
      "any.required": "FSSAI certificate number is required",
    }),
});

const menuItemValidation = joi.object({
  // Basic Details
  itemName: joi.string().trim().required().messages({
    "string.empty": "Item name is required",
    "any.required": "Item name is required",
  }),

  description: joi.string().allow("").optional(),

  foodType: joi.string().valid("veg", "non-veg").required().messages({
    "any.only": "Food type must be veg or non-veg",
    "any.required": "Food type is required",
  }),

  category: joi.string().required().messages({
    "string.empty": "Category is required",
    "any.required": "Category is required",
  }),

  // Image
  image: joi.string().uri().allow("").optional(),

  // Pricing
  basePrice: joi.number().positive().required().messages({
    "number.base": "Base price must be a number",
    "number.positive": "Base price must be greater than 0",
    "any.required": "Base price is required",
  }),

  discountPrice: joi
    .number()
    .min(0)
    .max(joi.ref("basePrice"))
    .default(0)
    .messages({
      "number.max": "Discount price cannot be greater than base price",
    }),

  gst: joi.number().valid(0, 5, 12, 18, 28).default(5),

  // Variants
  variants: joi.array().items(
    joi.object({
      name: joi.string().required(),
      price: joi.number().positive().required(),
    }),
  ),

  // Addons
  addons: joi.array().items(
    joi.object({
      name: joi.string().required(),
      price: joi.number().min(0).required(),
    }),
  ),

  // Tags
  tags: joi
    .array()
    .items(
      joi
        .string()
        .valid(
          "Bestseller",
          "Must-try",
          "Chef's special",
          "Spicy",
          "Gluten-free",
          "Jain",
          "No onion/garlic",
          "Low calorie",
        ),
    ),

  // Availability
  isAvailable: joi.boolean().default(true),

  enablePreOrder: joi.boolean().default(false),

  allowSpecialInstructions: joi.boolean().default(true),

  eligibleForOffers: joi.boolean().default(true),

  // Preparation Time
  preparationTime: joi
    .object({
      min: joi.number().min(1).required(),

      max: joi.number().greater(joi.ref("min")).required(),
    })
    .required(),
});


const partnerContractSchema = joi.object({
  fullName: joi.string().trim().required(),

  designation: joi.string().trim().required(),

  place: joi.string().trim().required(),

  date: joi.date().optional(),

  declarationAccepted: joi.boolean()
    .valid(true)
    .required(),

  reviewedSections: joi.array()
    .items(
      joi.string().valid(
        "terms_of_service",
        "commission_payment_terms",
        "operational_guidelines",
        "privacy_data_policy"
      )
    )
    .min(4)
    .required(),
});
module.exports = {
  restaurantValidate,
  restaurantDocumentsValidate,
  menuItemValidation,
  partnerContractSchema
};
