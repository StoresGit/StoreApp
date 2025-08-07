const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const { getItemCategory, createItemCategory, updateItemCategory, deleteItemCategory, getSubCategories } = require('../controllers/ItemCategoryController');

router.get('/', auth, getItemCategory);
router.post('/', auth, createItemCategory);
router.put('/:id', auth, updateItemCategory);
router.delete('/:id', auth, deleteItemCategory);
router.get('/subcategories/:parentId', auth, getSubCategories);

module.exports = router;
