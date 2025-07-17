const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// GET all sections
router.get('/', sectionController.getSections);

// GET active sections only
router.get('/active', sectionController.getActiveSections);

// GET single section by ID
router.get('/:id', sectionController.getSectionById);

// POST create new section
router.post('/', sectionController.createSection);

// PUT update section
router.put('/:id', sectionController.updateSection);

// DELETE section
router.delete('/:id', sectionController.deleteSection);

module.exports = router; 