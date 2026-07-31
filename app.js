// require("dotenv").config();

// const express = require("express");
// const http = require("http");
// const path = require("path");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");
// const { Server } = require("socket.io");

// const connectDB = require("./app/config/dbcon");


// const AuthRoute = require("./app/routes/authRoutes");
// const AdminRoute = require("./app/routes/adminRoutes");
// const restaurantRoute = require("./app/routes/restaurantRoutes");
// const userRoute = require("./app/routes/userRoutes");

// const app = express();


// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//     credentials: true,
//   },
// });

// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// const onlineRestaurants = new Map();

// io.on("connection", (socket) => {
//   console.log(`Socket Connected: ${socket.id}`);

//   socket.on("restaurant:join", (restaurantId) => {
//     onlineRestaurants.set(restaurantId, socket.id);

//     console.log(`Restaurant Online: ${restaurantId}`);

//     console.log("Online Restaurants:");
//     console.log(onlineRestaurants);
//   });


//   socket.on("disconnect", () => {
//     console.log(` Socket Disconnected: ${socket.id}`);

//     for (const [restaurantId, socketId] of onlineRestaurants.entries()) {
//       if (socketId === socket.id) {
//         onlineRestaurants.delete(restaurantId);

//         console.log(`Restaurant Offline: ${restaurantId}`);
//         break;
//       }
//     }

//     console.log("Online Restaurants:");
//     console.log(onlineRestaurants);
//   });
// });

// // ---------------- MIDDLEWARE ---------------- //

// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     credentials: true,
//   })
// );

// app.use(cookieParser());
// app.use(express.json());

// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// app.use(express.static(path.join(__dirname, "public")));
// app.use("/uploads", express.static("uploads"));

// // ---------------- ROUTES ---------------- //

// app.use(AuthRoute);
// app.use(AdminRoute);
// app.use(restaurantRoute);
// app.use(userRoute);

// // ---------------- START SERVER ---------------- //

// const PORT = process.env.PORT || 4000;

// const startServer = async () => {
//   try {
//     await connectDB();

//     server.listen(PORT, () => {
//       console.log(`Server running at http://localhost:${PORT}`);
//     });
//   } catch (err) {
//     console.error("Server startup failed:", err.message);
//     process.exit(1);
//   }
// };

// startServer();

require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const path = require("path");



// DB connection

const AuthRoute = require("./app/routes/authRoutes");
const AdminRoute = require("./app/routes/adminRoutes");
const restaurantRoute = require("./app/routes/restaurantRoutes");
const userRoute = require("./app/routes/userRoutes");

const connectDB = require("./config/dbcon");
const { initSocket } = require("./app/socket/socket");

const app = express();

const server = http.createServer(app);

initSocket(server);


app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use(AuthRoute);
app.use(AdminRoute);
app.use(restaurantRoute);
app.use(userRoute);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

// ---------------- SWAGGER ---------------- //


// ---------------- ROUTES ---------------- //

app.use(AuthRoute);
app.use(AdminRoute);
app.use(restaurantRoute);

app.use("/uploads", express.static("uploads"));

// ---------------- SERVER START ---------------- //

// Server
const PORT = process.env.PORT || 4000;
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server Running on ${PORT}`);
  });
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
