const express = require('express');
const router = express.Router();
const roleController = require('../controllers/currencyController');

router.get('/', roleController.getRoles);
router.post('/', roleController.addRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;