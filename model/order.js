const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const orderSchema = new Schema({
  userId: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Food Processing", "Confirmed", "Out of order"],
    default: "Food Processing",
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  address: {
    type: Object,
    required: true,
  },
  items: {
    type: [],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  payment: {
    type: Boolean,
    default: false,
  },
  paymentIntentId: Number,
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
