const express = require('express');
const router = express.Router();
const {
  getAllPurchaseCategories,
  getPurchaseCategory,
  createPurchaseCategory,
  updatePurchaseCategory,
  deletePurchaseCategory
} = require('../controllers/purchaseCategoryController');

// Get all purchase categories
router.get('/', getAllPurchaseCategories);

// Get single purchase category
router.get('/:id', getPurchaseCategory);

// Create purchase category
router.post('/', createPurchaseCategory);

// Update purchase category
router.put('/:id', updatePurchaseCategory);

// Delete purchase category
router.delete('/:id', deletePurchaseCategory);

module.exports = router; 