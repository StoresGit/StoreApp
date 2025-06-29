const Item = require('../models/Item');
const Packaging = require('../models/Packaging');

// @desc    Get all packaging items
// @route   GET /api/packaging
// @access  Public
exports.getAllPackaging = async (req, res) => {
  try {
    const packaging = await Packaging.find({ isActive: true })
      .populate('itemId', 'nameEn name')
      .sort({ createdAt: -1 });
    
    // Filter out packaging with null/missing itemId (orphaned records)
    const validPackaging = packaging.filter(pkg => pkg.itemId !== null);
    
    // Log orphaned records for cleanup
    const orphanedCount = packaging.length - validPackaging.length;
    if (orphanedCount > 0) {
      console.log(`Found ${orphanedCount} orphaned packaging records`);
    }
    
    res.json(validPackaging);
  } catch (err) {
    console.error('Error fetching all packaging:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clean up orphaned packaging records
// @route   DELETE /api/packaging/cleanup-orphaned
// @access  Private
exports.cleanupOrphanedPackaging = async (req, res) => {
  try {
    // Find packaging records where itemId doesn't exist in Items collection
    const allPackaging = await Packaging.find({ isActive: true });
    const orphanedPackaging = [];
    
    for (const pkg of allPackaging) {
      const itemExists = await Item.findById(pkg.itemId);
      if (!itemExists) {
        orphanedPackaging.push(pkg._id);
      }
    }
    
    if (orphanedPackaging.length > 0) {
      // Soft delete orphaned records
      const result = await Packaging.updateMany(
        { _id: { $in: orphanedPackaging } },
        { isActive: false }
      );
      
      console.log(`Cleaned up ${result.modifiedCount} orphaned packaging records`);
      
      res.json({
        success: true,
        message: `Cleaned up ${result.modifiedCount} orphaned packaging records`,
        cleanedCount: result.modifiedCount
      });
    } else {
      res.json({
        success: true,
        message: 'No orphaned packaging records found',
        cleanedCount: 0
      });
    }
  } catch (error) {
    console.error('Error cleaning up orphaned packaging:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during cleanup'
    });
  }
};

// @desc    Create new packaging item
// @route   POST /api/packaging
// @access  Private
exports.createPackaging = async (req, res) => {
  try {
    const { itemId, type, amount, unit, packSize, packUnit, description } = req.body;

    // Validate required fields
    if (!itemId || !type || !amount || !unit) {
      return res.status(400).json({
        success: false,
        message: 'ItemId, type, amount, and unit are required'
      });
    }

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Create packaging record
    const packagingData = {
      itemId,
      type,
      amount: parseFloat(amount),
      unit,
      description: description || ''
    };

    if (packSize) {
      packagingData.packSize = parseInt(packSize);
      packagingData.packUnit = packUnit || 'x';
    }

    const packaging = await Packaging.create(packagingData);
    await packaging.populate('itemId', 'nameEn name');

    res.status(201).json({
      success: true,
      message: 'Packaging created successfully',
      data: packaging
    });
  } catch (error) {
    console.error('Create packaging error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update packaging item
// @route   PUT /api/packaging/:id
// @access  Private
exports.updatePackagingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, type, amount, unit, packSize, packUnit, description } = req.body;

    // Validate required fields
    if (!itemId || !type || !amount || !unit) {
      return res.status(400).json({
        success: false,
        message: 'ItemId, type, amount, and unit are required'
      });
    }

    // Check if packaging exists
    const packaging = await Packaging.findById(id);
    if (!packaging) {
      return res.status(404).json({
        success: false,
        message: 'Packaging not found'
      });
    }

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Update packaging data
    const updateData = {
      itemId,
      type,
      amount: parseFloat(amount),
      unit,
      description: description || ''
    };

    if (packSize) {
      updateData.packSize = parseInt(packSize);
      updateData.packUnit = packUnit || 'x';
    } else {
      updateData.packSize = undefined;
      updateData.packUnit = undefined;
    }

    const updatedPackaging = await Packaging.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('itemId', 'nameEn name');

    res.json({
      success: true,
      message: 'Packaging updated successfully',
      data: updatedPackaging
    });
  } catch (error) {
    console.error('Update packaging error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete packaging item
// @route   DELETE /api/packaging/:id
// @access  Private
exports.deletePackagingItem = async (req, res) => {
  try {
    const { id } = req.params;

    const packaging = await Packaging.findById(id);
    if (!packaging) {
      return res.status(404).json({
        success: false,
        message: 'Packaging not found'
      });
    }

    // Soft delete by setting isActive to false
    await Packaging.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: 'Packaging deleted successfully'
    });
  } catch (error) {
    console.error('Delete packaging error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add packaging to item
// @route   POST /api/items/:id/packaging
// @access  Private
exports.addPackaging = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, amount, unit, packSize, packUnit } = req.body;

    // Find the item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Prepare packaging data
    const packagingData = {
      amount: parseFloat(amount),
      unit,
      createdAt: new Date()
    };

    if (type === 'pack') {
      packagingData.packSize = parseInt(packSize);
      packagingData.packUnit = packUnit;
    }

    // Update item with packaging
    if (type === 'base') {
      item.basePackaging = packagingData;
    } else if (type === 'pack') {
      item.packPackaging = packagingData;
    }

    await item.save();

    // Also create a packaging record for history
    await Packaging.create({
      itemId: id,
      type,
      amount: parseFloat(amount),
      unit,
      ...(type === 'pack' && {
        packSize: parseInt(packSize),
        packUnit
      })
    });

    res.status(201).json({
      success: true,
      message: 'Packaging added successfully',
      data: item
    });
  } catch (error) {
    console.error('Add packaging error:', error);
    next(error);
  }
};

// @desc    Get packaging history for item
// @route   GET /api/items/:id/packaging
// @access  Public
exports.getPackagingByItemId = async (req, res) => {
  try {
    const { id } = req.params;
    const packaging = await Packaging.find({ itemId: id });
    res.json(packaging);
  } catch (err) {
    console.error('Error fetching packaging:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPackagingHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const packagingHistory = await Packaging.find({ itemId: id, isActive: true })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: packagingHistory.length,
      data: packagingHistory
    });
  } catch (error) {
    console.error('Get packaging history error:', error);
    next(error);
  }
};

// @desc    Update packaging
// @route   PUT /api/items/:id/packaging
// @access  Private
exports.updatePackaging = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, amount, unit, packSize, packUnit } = req.body;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const packagingData = {
      amount: parseFloat(amount),
      unit,
      createdAt: new Date()
    };

    if (type === 'pack') {
      packagingData.packSize = parseInt(packSize);
      packagingData.packUnit = packUnit;
    }

    if (type === 'base') {
      item.basePackaging = packagingData;
    } else if (type === 'pack') {
      item.packPackaging = packagingData;
    }

    await item.save();

    res.status(200).json({
      success: true,
      message: 'Packaging updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update packaging error:', error);
    next(error);
  }
};

// @desc    Delete packaging
// @route   DELETE /api/items/:id/packaging/:type
// @access  Private
exports.deletePackaging = async (req, res, next) => {
  try {
    const { id, type } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (type === 'base') {
      item.basePackaging = undefined;
    } else if (type === 'pack') {
      item.packPackaging = undefined;
    }

    await item.save();

    res.status(200).json({
      success: true,
      message: 'Packaging deleted successfully'
    });
  } catch (error) {
    console.error('Delete packaging error:', error);
    next(error);
  }
};
