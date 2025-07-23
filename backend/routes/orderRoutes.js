const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireMasterAdmin } = require('../middleware/permissions');

// Create order
router.post('/', requireMasterAdmin, orderController.createOrder);
// Get all orders
router.get('/', requireMasterAdmin, orderController.getOrders);
// Get order by ID
router.get('/:id', requireMasterAdmin, orderController.getOrderById);
// Update order
router.patch('/:id', requireMasterAdmin, orderController.updateOrder);
// Delete order
router.delete('/:id', requireMasterAdmin, orderController.deleteOrder);

module.exports = router; 