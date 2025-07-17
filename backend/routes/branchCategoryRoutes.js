const express = require('express');
const router = express.Router();
const {
  getAllBranchCategories,
  getBranchCategory,
  createBranchCategory,
  updateBranchCategory,
  deleteBranchCategory
} = require('../controllers/branchCategoryController');

// Get all branch categories
router.get('/', getAllBranchCategories);

// Get single branch category
router.get('/:id', getBranchCategory);

// Create branch category
router.post('/', createBranchCategory);

// Update branch category
router.put('/:id', updateBranchCategory);

// Delete branch category
router.delete('/:id', deleteBranchCategory);

module.exports = router; 