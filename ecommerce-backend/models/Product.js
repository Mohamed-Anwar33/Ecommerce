const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
  },
    image: {
    type: String,
    required: false, // Not every product must have an image initially
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
  },
});

module.exports = mongoose.model("Product", productSchema);
