const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const wastageController = require('../controllers/wastageController');
const auth = require('../middleware/auth');

console.log('Wastage routes loaded');
console.log('Wastage controller:', wastageController);
console.log('Auth middleware:', typeof auth);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/wastage';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'wastage-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

console.log('Setting up wastage routes...');

// Wastage routes
router.post('/', auth, upload.single('media'), wastageController.createWastage);
router.get('/', auth, wastageController.getAllWastage);
router.get('/:id', auth, wastageController.getWastageById);
router.put('/:id', auth, upload.single('media'), wastageController.updateWastage);
router.delete('/:id', auth, wastageController.deleteWastage);

console.log('Wastage routes setup complete');

module.exports = router;
