const Tour = require("../model/tourModel");
const Order = require("../model/order");

exports.getAllOrder = async (req, res, next) => {
  const tour = await Order.find();

  res.status(200).json({
    status: "susccess",
    data: tour,
  });
};
