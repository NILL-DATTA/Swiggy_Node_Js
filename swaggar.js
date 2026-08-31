const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Swiggy Food Order Management API",
            version: "1.0.0",
            description: "API Documentation",
        },

        servers: [
            {
                url: "http://localhost:4000",
                description: "Local Server",
            },
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },

    apis: [
        "./app/routes/adminRoutes.js",
        "./app/routes/restaurantRoutes.js",
        "./app/routes/authRoutes.js",
        "./app/routes/userRoutes.js",
    ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    swaggerSpec,
};