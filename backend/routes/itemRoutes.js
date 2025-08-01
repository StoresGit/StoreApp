// routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const auth = require('../middleware/auth');

router.get('/', auth, itemController.getItems);
router.get('/search', auth, itemController.searchItems); // Add search route before /:id
router.get('/code/:itemCode', auth, itemController.getItemByCode); // Get item by code
router.get('/:id', auth, itemController.getItemById);
router.post('/', auth, itemController.createItem);
router.put('/:id', auth, itemController.updateItem);
router.delete('/:id', auth, itemController.deleteItem);

module.exports = router;
