const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const { getItemCategory, createItemCategory, updateItemCategory, deleteItemCategory } = require('../controllers/ItemCategoryController');

router.get('/', auth, getItemCategory);
router.post('/', auth, createItemCategory);
router.put('/:id', auth, updateItemCategory);
router.delete('/:id', auth, deleteItemCategory);

module.exports = router;
