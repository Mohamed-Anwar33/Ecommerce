require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const errorHandler = require("./middleware/errorHandler");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");

const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const initializeAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('⚠️ Admin credentials not provided in environment variables');
    console.log('Skipping admin initialization...');
    return;
  }

  const adminExists = await Admin.findOne({ email: adminEmail });

  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    await Admin.create({ email: adminEmail, password: hashedPassword });
    console.log("Admin account created");
  } else {
    console.log("Admin account already exists");
  }
};

connectDB()
  .then(() => initializeAdmin())
  .catch((err) => console.error("DB Connection Error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
