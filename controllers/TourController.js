const Tour = require("../model/tourModel");

exports.getAllTour = async (req, res, next) => {
  const tour = await Tour.find();

  res.status(200).json({
    status: "susccess",
    data: tour,
  });
};
