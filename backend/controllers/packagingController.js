const Item = require('../models/Item');
const Packaging = require('../models/Packaging');

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
