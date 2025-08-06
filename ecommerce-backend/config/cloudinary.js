const cloudinary = require("cloudinary").v2;

cloudinary.config({
  url: process.env.CLOUDINARY_URL,
});

console.log("Cloudinary Config Loaded from URL:", {
  url: process.env.CLOUDINARY_URL ? "Set" : "Not Set",
});

module.exports = cloudinary;
