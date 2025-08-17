const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const subCategoryController = require('../controllers/subCategoryController');

router.get('/', auth, subCategoryController.getSubCategories);
router.get('/:id', auth, subCategoryController.getSubCategoryById);
router.post('/', auth, subCategoryController.createSubCategory);
router.put('/:id', auth, subCategoryController.updateSubCategory);
router.delete('/:id', auth, subCategoryController.deleteSubCategory);

module.exports = router; 