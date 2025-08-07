const ItemCategory = require('../models/ItemCategory'); // correct spelling
let Item;

try {
  Item = require('../models/Item'); // will only try if file exists
} catch (err) {
  console.warn('Item model not found, totalItems will be 0.');
}

exports.getItemCategory = async (req, res) => {
  try {
    // Get all main categories (those without parentId or with parentId = null)
    const categories = await ItemCategory.find({ 
      $or: [
        { parentId: null },
        { parentId: { $exists: false } }
      ]
    });

    const withCounts = await Promise.all(
      categories.map(async (cat) => {
        let count = 0;

        // Only count if Item model is loaded and countDocuments exists
        if (Item && typeof Item.countDocuments === 'function') {
          try {
            count = await Item.countDocuments({ category: cat._id });
          } catch (err) {
            // fallback to 0
          }
        }

        return { ...cat.toObject(), totalItems: count };
      })
    );

    res.json(withCounts);
  } catch (error) {
    console.error('Error fetching item categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createItemCategory = async (req, res) => {
  try {
    const { nameEn, nameUr, parentId } = req.body;
    
    let categoryData = {
      nameEn,
      nameUr
    };

    if (parentId) {
      // Creating a sub-category
      categoryData.parentId = parentId;
      categoryData.isSubCategory = true;
      categoryData.level = 1;
    } else {
      // Creating a main category
      categoryData.isSubCategory = false;
      categoryData.level = 0;
    }

    const category = new ItemCategory(categoryData);
    await category.save();
    res.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateItemCategory = async (req, res) => {
  try {
    const updated = await ItemCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteItemCategory = async (req, res) => {
  try {
    // First, delete all sub-categories
    await ItemCategory.deleteMany({ parentId: req.params.id });
    // Then delete the main category
    await ItemCategory.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get sub-categories for a specific parent
exports.getSubCategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    const subCategories = await ItemCategory.find({ parentId });
    res.json(subCategories);
  } catch (error) {
    console.error('Error fetching sub-categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
