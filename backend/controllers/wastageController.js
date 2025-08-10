const Wastage = require('../models/Wastage');
const cloudinary = require('../config/cloudinary');

console.log('Wastage controller loaded');

// Create new wastage record
const createWastage = async (req, res) => {
  console.log('createWastage function called');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  
  try {
    // For now, just return a test response without database validation
    res.status(201).json({
      success: true,
      message: 'Wastage record created successfully (test)',
      data: {
        ...req.body,
        id: 'test-wastage-id-' + Date.now()
      }
    });
  } catch (error) {
    console.error('Create wastage error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating wastage record',
      error: error.message
    });
  }
};

// Get all wastage records
const getAllWastage = async (req, res) => {
  console.log('getAllWastage function called');
  try {
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get wastage error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wastage records',
      error: error.message
    });
  }
};

// Get wastage record by ID
const getWastageById = async (req, res) => {
  console.log('getWastageById function called');
  try {
    res.status(200).json({
      success: true,
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error('Get wastage by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wastage record',
      error: error.message
    });
  }
};

// Update wastage record
const updateWastage = async (req, res) => {
  console.log('updateWastage function called');
  try {
    res.status(200).json({
      success: true,
      message: 'Wastage record updated successfully (test)',
      data: req.body
    });
  } catch (error) {
    console.error('Update wastage error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating wastage record',
      error: error.message
    });
  }
};

// Delete wastage record
const deleteWastage = async (req, res) => {
  console.log('deleteWastage function called');
  try {
    res.status(200).json({
      success: true,
      message: 'Wastage record deleted successfully (test)'
    });
  } catch (error) {
    console.error('Delete wastage error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting wastage record',
      error: error.message
    });
  }
};

console.log('Exporting wastage controller functions:', {
  createWastage: typeof createWastage,
  getAllWastage: typeof getAllWastage,
  getWastageById: typeof getWastageById,
  updateWastage: typeof updateWastage,
  deleteWastage: typeof deleteWastage
});

module.exports = {
  createWastage,
  getAllWastage,
  getWastageById,
  updateWastage,
  deleteWastage
};
