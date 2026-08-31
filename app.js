require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const AuthRoute = require("./app/routes/authRoutes");
const AdminRoute = require("./app/routes/adminRoutes");
const restaurantRoute = require("./app/routes/restaurantRoutes");
const userRoute = require("./app/routes/userRoutes");

const connectDB = require("./config/dbcon");
const { initSocket } = require("./app/socket/socket");
const { swaggerUi, swaggerSpec } = require("./swaggar");
const app = express();

const server = http.createServer(app);

// Socket.IO
initSocket(server);

// CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],
    credentials: true,
  })
);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);
// Body
app.use(express.json());
app.use(cookieParser());

// Static
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// View
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes — ONLY ONCE
app.use(AuthRoute);
app.use(AdminRoute);
app.use(restaurantRoute);
app.use(userRoute);

// Server
const PORT = process.env.PORT || 4000;

const startServer = async () => {

  try {

    await connectDB();

    server.listen(PORT, () => {
      console.log(
        `Server running at http://localhost:${PORT}`
      );
      console.log(
        `Swagger Docs: http://localhost:${PORT}/api-docs`
      );
    });

  } catch (error) {

    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();