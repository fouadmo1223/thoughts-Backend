const express = require("express");
require("dotenv").config();
const connectDB = require("../config/connentToDB");
// const xss = require("xss-clean");
const { xss } = require("express-xss-sanitizer");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const authPath = require("../routes/authRoute");
const usersPath = require("../routes/usersRoute");
const postsPath = require("../routes/postsRoute");
const commentsPath = require("../routes/commentsRoute");
const categoriesPath = require("../routes/categoriesRoute");
const passwordRoutes = require("../routes/passRoute");

const { notFound, errorHandeler } = require("../middlewares/errors");
const app = express();

// connect to database
connectDB();

//middlewares
app.use(express.json());
app.use(cors());
// app.use(xss());
app.use(hpp());
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  // store: ... , // Redis, Memcached, etc. See below.
});

// Apply the rate limiting middleware to all requests.
app.use(limiter);

// routes

app.use("/api/auth", authPath);
app.use("/api/users", usersPath);
app.use("/api/posts", postsPath);
app.use("/api/comments", commentsPath);
app.use("/api/categories", categoriesPath);
app.use("/api/password", passwordRoutes);

// errors

// it must be in that order
app.use(notFound);

app.use(errorHandeler);

module.exports = serverless(app);
