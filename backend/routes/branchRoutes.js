const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const auth = require('../middleware/auth');

router.get('/', auth, branchController.getBranches);
router.post('/', auth, branchController.addBranch);
router.put('/:id', auth, branchController.updateBranch);
router.delete('/:id', auth, branchController.deleteBranch);

module.exports = router;