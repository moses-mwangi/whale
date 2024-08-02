const express = require("express");
const tourRouter = require("./routes/tourRoute");

const app = express();

/// Test middleware
app.use((req, res, next) => {
  console.log("Test middleware");
  next();
});

app.use("/api/tours", tourRouter);

app.all("*", (req, res, next) => {
  next(`Cant find ${req.originalUrl} on this server`);
});

module.exports = app;
