const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Create order
router.post('/', orderController.createOrder);
// Get all orders
router.get('/', orderController.getOrders);
// Get order by ID
router.get('/:id', orderController.getOrderById);
// Update order
router.patch('/:id', orderController.updateOrder);
// Delete order
router.delete('/:id', orderController.deleteOrder);

module.exports = router; 