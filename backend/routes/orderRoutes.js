const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const { requireMasterAdmin } = require('../middleware/permissions');

// Create order
router.post('/', auth, requireMasterAdmin, orderController.createOrder);
// Get all orders
router.get('/', auth, requireMasterAdmin, orderController.getOrders);
// Get order by ID
router.get('/:id', auth, requireMasterAdmin, orderController.getOrderById);
// Update order
router.patch('/:id', auth, requireMasterAdmin, orderController.updateOrder);
// Delete order
router.delete('/:id', auth, requireMasterAdmin, orderController.deleteOrder);

module.exports = router; 