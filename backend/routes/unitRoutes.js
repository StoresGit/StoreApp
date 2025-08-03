const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const auth = require('../middleware/auth');

router.get('/', auth, unitController.getUnit);
router.get('/branch', auth, unitController.getBranchUnits);
router.post('/', auth, unitController.addUnit);
router.put('/:id', auth, unitController.updateUnit);
router.delete('/:id', auth, unitController.deleteUnit);

module.exports = router;