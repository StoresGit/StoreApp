const Item = require('../models/Item');
const Packaging = require('../models/Packaging');

// @desc    Get all packaging items
// @route   GET /api/packaging
// @access  Public
exports.getAllPackaging = async (req, res) => {
  try {
    const packaging = await Packaging.find()
      .populate('itemId', 'nameEn name')
      .populate('branches', 'name')
      .populate('brands', 'nameEn nameAr')
      .sort({ createdAt: -1 });
    res.json(packaging);
  } catch (error) {
    console.error('Error fetching packaging:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clean up orphaned packaging records
// @route   DELETE /api/packaging/cleanup-orphaned
// @access  Private
exports.cleanupOrphanedPackaging = async (req, res) => {
  try {
    // Find all packaging items
    const allPackaging = await Packaging.find();
    
    // Find packaging items with invalid item references
    const orphanedPackaging = [];
    for (const pkg of allPackaging) {
      if (!pkg.itemId) {
        orphanedPackaging.push(pkg._id);
        continue;
      }
      
      const item = await Item.findById(pkg.itemId);
      if (!item) {
        orphanedPackaging.push(pkg._id);
      }
    }

    // Delete orphaned packaging
    if (orphanedPackaging.length > 0) {
      await Packaging.deleteMany({ _id: { $in: orphanedPackaging } });
    }

    res.json({
      success: true,
      message: `Cleanup completed. Removed ${orphanedPackaging.length} orphaned packaging records.`,
      cleanedCount: orphanedPackaging.length
    });
  } catch (error) {
    console.error('Error cleaning up orphaned packaging:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new packaging item
// @route   POST /api/packaging
// @access  Private
exports.createPackaging = async (req, res) => {
  try {
    const { itemId, type, amount, unit, packSize, packUnit, description, branches, brands } = req.body;
    
    if (!itemId || !type || !amount || !unit) {
      return res.status(400).json({ message: 'itemId, type, amount, and unit are required' });
    }

    // Verify item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const packaging = new Packaging({
      itemId,
      type,
      amount,
      unit,
      packSize,
      packUnit,
      description,
      branches: branches || [],
      brands: brands || []
    });

    const savedPackaging = await packaging.save();
    const populatedPackaging = await Packaging.findById(savedPackaging._id)
      .populate('itemId', 'nameEn name')
      .populate('branches', 'name')
      .populate('brands', 'nameEn nameAr');
    
    res.status(201).json(populatedPackaging);
  } catch (error) {
    console.error('Error creating packaging:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update packaging item
// @route   PUT /api/packaging/:id
// @access  Private
exports.updatePackagingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, type, amount, unit, packSize, packUnit, description, branches, brands } = req.body;

    if (!itemId || !type || !amount || !unit) {
      return res.status(400).json({ message: 'itemId, type, amount, and unit are required' });
    }

    const packaging = await Packaging.findById(id);
    if (!packaging) {
      return res.status(404).json({ message: 'Packaging not found' });
    }

    // Verify item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    packaging.itemId = itemId;
    packaging.type = type;
    packaging.amount = amount;
    packaging.unit = unit;
    packaging.packSize = packSize;
    packaging.packUnit = packUnit;
    packaging.description = description;
    packaging.branches = branches || [];
    packaging.brands = brands || [];

    const savedPackaging = await packaging.save();
    const populatedPackaging = await Packaging.findById(savedPackaging._id)
      .populate('itemId', 'nameEn name')
      .populate('branches', 'name')
      .populate('brands', 'nameEn nameAr');
    
    res.json(populatedPackaging);
  } catch (error) {
    console.error('Error updating packaging:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Packaging not found' });
    }

    await Packaging.findByIdAndDelete(id);
    res.json({ message: 'Packaging deleted successfully' });
  } catch (error) {
    console.error('Error deleting packaging:', error);
    res.status(500).json({ message: 'Server error' });
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
    const { itemId } = req.params;
    const packaging = await Packaging.find({ itemId })
      .populate('branches', 'name')
      .populate('brands', 'nameEn nameAr')
      .sort({ createdAt: -1 });
    res.json(packaging);
  } catch (error) {
    console.error('Error fetching packaging by item ID:', error);
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
