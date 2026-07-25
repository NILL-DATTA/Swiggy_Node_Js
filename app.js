require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

// DB connection
const connectDB = require("./app/config/dbcon");

// Routes
const AuthRoute = require("./app/routes/authRoutes");
const AdminRoute = require("./app/routes/adminRoutes");
const restaurantRoute = require("./app/routes/restaurantRoutes");

const app = express();

// ---------------- MIDDLEWARE ---------------- //

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

// ---------------- SWAGGER ---------------- //

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------------- ROUTES ---------------- //

app.use(AuthRoute);
app.use(AdminRoute);
app.use(restaurantRoute);

app.use("/uploads", express.static("uploads"));

// ---------------- SERVER START ---------------- //

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Swagger Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
};

startServer();
