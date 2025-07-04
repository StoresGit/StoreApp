const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SupplierItem = require("../models/SupplierItem");
const authMiddleware = require("../middleware/auth");

// Get all supplier-item relationships for a specific item
router.get("/item/:itemId", authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    const supplierItems = await SupplierItem.find({ item: itemId, isActive: true })
      .populate('supplier', 'legalName shortName')
      .populate('item', 'nameEn name')
      .populate('packaging');
    
    res.json(supplierItems);
  } catch (error) {
    console.error("Error fetching supplier items:", error);
    res.status(500).json({ message: "Error fetching supplier items", error: error.message });
  }
});

// Create or update supplier-item relationships
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { itemId, supplierPackagingData } = req.body;
    
    console.log('Saving supplier items for item:', itemId);
    console.log('Supplier packaging data:', JSON.stringify(supplierPackagingData, null, 2));
    
    // First, deactivate all existing supplier-item relationships for this item
    await SupplierItem.updateMany(
      { item: itemId },
      { isActive: false }
    );
    
    // Create new supplier-item relationships
    const supplierItems = [];
    
    for (const [packagingKey, supplierIds] of Object.entries(supplierPackagingData)) {
      if (supplierIds && supplierIds.length > 0) {
        // Handle different packaging key formats
        let packagingType, packagingId;
        
        if (packagingKey === 'base') {
          packagingType = 'base';
          packagingId = null; // Base packaging doesn't have a specific ID
        } else if (packagingKey === 'pack') {
          packagingType = 'pack';
          packagingId = null; // Pack packaging doesn't have a specific ID
        } else if (packagingKey.startsWith('additional_')) {
          packagingType = 'additional';
          packagingId = packagingKey.split('_')[1]; // Extract index or ID
        } else {
          // Handle format like "base-id" or "pack-id"
          const parts = packagingKey.split('-');
          packagingType = parts[0];
          packagingId = parts[1];
        }
        
        for (const supplierId of supplierIds) {
          const supplierItemData = {
            supplier: supplierId,
            item: itemId,
            packagingType: packagingType,
            isActive: true
          };
          
          // Only add packaging field if it's a valid ObjectId
          if (packagingId && mongoose.Types.ObjectId.isValid(packagingId)) {
            supplierItemData.packaging = packagingId;
          }
          
          const supplierItem = new SupplierItem(supplierItemData);
          
          const savedSupplierItem = await supplierItem.save();
          await savedSupplierItem.populate(['supplier', 'item', 'packaging']);
          supplierItems.push(savedSupplierItem);
        }
      }
    }
    
    res.status(201).json({
      message: "Supplier-item relationships saved successfully",
      supplierItems
    });
  } catch (error) {
    console.error("Error saving supplier items:", error);
    res.status(500).json({ message: "Error saving supplier items", error: error.message });
  }
});

// Update a specific supplier-item relationship
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const supplierItem = await SupplierItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate(['supplier', 'item', 'packaging']);
    
    if (!supplierItem) {
      return res.status(404).json({ message: "Supplier-item relationship not found" });
    }
    
    res.json(supplierItem);
  } catch (error) {
    console.error("Error updating supplier item:", error);
    res.status(500).json({ message: "Error updating supplier item", error: error.message });
  }
});

// Delete a supplier-item relationship
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplierItem = await SupplierItem.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!supplierItem) {
      return res.status(404).json({ message: "Supplier-item relationship not found" });
    }
    
    res.json({ message: "Supplier-item relationship deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier item:", error);
    res.status(500).json({ message: "Error deleting supplier item", error: error.message });
  }
});

module.exports = router; 