const Wastage = require('../models/Wastage');
const cloudinary = require('../config/cloudinary');

console.log('Wastage controller loaded');

// Create new wastage record
const createWastage = async (req, res) => {
  console.log('createWastage function called');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  
  try {
    const {
      branch,
      section,
      eventDate,
      eventName,
      itemName,
      itemCode,
      unit,
      qty,
      wastageType
    } = req.body;

    // Validate required fields
    if (!branch || !section || !eventDate || !eventName || !itemName || !qty || !wastageType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Handle file upload to Cloudinary if file exists
    let mediaUrl = null;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'wastage',
          resource_type: 'auto'
        });
        mediaUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        // Continue without media if upload fails
      }
    }

    // Create wastage record - adjust field names to match schema
    const wastageData = {
      branches: [branch], // Convert single branch to array
      section,
      eventDate,
      eventName,
      itemName, // This should be the item ID from the frontend
      itemCode,
      unit,
      qty: parseFloat(qty),
      wastageType,
      media: mediaUrl,
      createdBy: req.user?._id || '000000000000000000000000' // Use authenticated user or default
    };

    console.log('Creating wastage with data:', wastageData);

    const newWastage = new Wastage(wastageData);
    const savedWastage = await newWastage.save();

    console.log('Wastage saved successfully:', savedWastage._id);

    // Populate the references for the response
    const populatedWastage = await Wastage.findById(savedWastage._id)
      .populate('branches', 'name')
      .populate('section', 'name')
      .populate('itemName', 'nameEn name');

    res.status(201).json({
      success: true,
      message: 'Wastage record created successfully',
      data: populatedWastage
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
    const wastageRecords = await Wastage.find()
      .populate('branches', 'name')
      .populate('section', 'name')
      .populate('itemName', 'nameEn name')
      .populate('createdBy', 'name')
      .sort({ eventDate: -1 });

    res.status(200).json({
      success: true,
      data: wastageRecords
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
    const wastage = await Wastage.findById(req.params.id)
      .populate('branches', 'name')
      .populate('section', 'name')
      .populate('itemName', 'nameEn name');

    if (!wastage) {
      return res.status(404).json({
        success: false,
        message: 'Wastage record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: wastage
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
    const wastageId = req.params.id;
    const updateData = req.body;

    // Handle file upload if new file is provided
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'wastage',
          resource_type: 'auto'
        });
        updateData.media = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
      }
    }

    const updatedWastage = await Wastage.findByIdAndUpdate(
      wastageId,
      updateData,
      { new: true }
    ).populate('branch', 'name').populate('section', 'name');

    if (!updatedWastage) {
      return res.status(404).json({
        success: false,
        message: 'Wastage record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Wastage record updated successfully',
      data: updatedWastage
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
    const wastage = await Wastage.findByIdAndDelete(req.params.id);
    
    if (!wastage) {
      return res.status(404).json({
        success: false,
        message: 'Wastage record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Wastage record deleted successfully'
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
