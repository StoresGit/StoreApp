const PurchaseCategory = require('../models/PurchaseCategory');

// Get all purchase categories
const getAllPurchaseCategories = async (req, res) => {
  try {
    const categories = await PurchaseCategory.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single purchase category
const getPurchaseCategory = async (req, res) => {
  try {
    const category = await PurchaseCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Purchase category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create purchase category
const createPurchaseCategory = async (req, res) => {
  try {
    const category = new PurchaseCategory(req.body);
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update purchase category
const updatePurchaseCategory = async (req, res) => {
  try {
    const category = await PurchaseCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Purchase category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete purchase category
const deletePurchaseCategory = async (req, res) => {
  try {
    const category = await PurchaseCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Purchase category not found' });
    }
    res.json({ message: 'Purchase category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPurchaseCategories,
  getPurchaseCategory,
  createPurchaseCategory,
  updatePurchaseCategory,
  deletePurchaseCategory
}; 