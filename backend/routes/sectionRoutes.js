const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const auth = require('../middleware/auth');

// GET active sections only (public)
router.get('/active', sectionController.getActiveSections);

// Apply auth middleware to all other routes
router.use(auth);

// GET all sections
router.get('/', sectionController.getSections);

// GET single section by ID
router.get('/:id', sectionController.getSectionById);

// POST create new section
router.post('/', sectionController.createSection);

// PUT update section
router.put('/:id', sectionController.updateSection);

// DELETE section
router.delete('/:id', sectionController.deleteSection);

module.exports = router; 