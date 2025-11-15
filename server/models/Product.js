const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  collection: { type: String, required: true },
  price: { type: Number, required: true },
  notes: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  rating: { type: Number, default: 4.5 },
  inStock: { type: Boolean, default: true },
  category: { type: String, required: true },
  volume: { type: String, default: '100ml' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);