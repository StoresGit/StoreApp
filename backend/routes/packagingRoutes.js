// routes/packagingRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllPackaging,
  createPackaging,
  updatePackagingItem,
  deletePackagingItem,
  cleanupOrphanedPackaging,
  getPackagingByItemId,
  getPackagingHistory,
  addPackaging,
  updatePackaging,
  deletePackaging
} = require('../controllers/packagingController');

// New routes for packaging management page
router.get('/', getAllPackaging);
router.post('/', createPackaging);
router.put('/:id', updatePackagingItem);
router.delete('/:id', deletePackagingItem);
router.delete('/cleanup/orphaned', cleanupOrphanedPackaging);

// Existing routes for item-specific packaging
router.get('/:id/history', getPackagingHistory);      // e.g., /packaging/123/history
router.get('/:id', getPackagingByItemId);             // e.g., /packaging/123

router.post('/:id', addPackaging);
router.put('/:id', updatePackaging);
router.delete('/:id/:type', deletePackaging);         // e.g., /packaging/123/base

module.exports = router;
