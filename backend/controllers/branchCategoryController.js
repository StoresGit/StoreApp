const BranchCategory = require('../models/BranchCategory');

// Get all branch categories
const getAllBranchCategories = async (req, res) => {
  try {
    const categories = await BranchCategory.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single branch category
const getBranchCategory = async (req, res) => {
  try {
    const category = await BranchCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Branch category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create branch category
const createBranchCategory = async (req, res) => {
  try {
    const category = new BranchCategory(req.body);
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update branch category
const updateBranchCategory = async (req, res) => {
  try {
    const category = await BranchCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Branch category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete branch category
const deleteBranchCategory = async (req, res) => {
  try {
    const category = await BranchCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Branch category not found' });
    }
    res.json({ message: 'Branch category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllBranchCategories,
  getBranchCategory,
  createBranchCategory,
  updateBranchCategory,
  deleteBranchCategory
}; 