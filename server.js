require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User'); // ✅ NEW
const bcrypt = require('bcryptjs');     // ✅ NEW
const jwt = require('jsonwebtoken');    // ✅ NEW

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // parse JSON body

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// ✅ Product Routes

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.send(product);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.send(products);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send({ message: "Product not found" });
    res.send(product);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).send({ message: "Product not found" });
    res.send(product);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).send({ message: "Product not found" });
    res.send({ message: "Product deleted" });
  } catch (err) {
    res.status(500).send(err);
  }
});

// ✅ ✅ ✅ AUTH ROUTES

// Register new user
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save new user
    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    res.status(500).send(err);
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Sign JWT token
    const token = jwt.sign(
      { userId: user._id },
      "your_jwt_secret", // replace with env later
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).send(err);
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
