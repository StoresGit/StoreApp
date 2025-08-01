// controllers/unitController.js
const Unit = require("../models/Units");

// -------------------------
// GET  /units
// -------------------------
exports.getUnit = async (req, res) => {
  try {
    const units = await Unit.find()
      .populate('branch', 'name');
    return res.status(200).json(units);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch units" });
  }
};

// -------------------------
// POST /units
// -------------------------
exports.addUnit = async (req, res) => {
  try {
    const { name, baseUnit, standardUnit, symbol } = req.body;
    
    if (!name || !baseUnit || !symbol) {
      return res.status(400).json({ error: "name, baseUnit & symbol are required" });
    }

    // Validate baseUnit is one of the allowed values
    const allowedBaseUnits = ['kg', 'liter', 'pieces'];
    if (!allowedBaseUnits.includes(baseUnit)) {
      return res.status(400).json({ error: "baseUnit must be one of: kg, liter, pieces" });
    }

    const unitData = {
      name,
      baseUnit,
      symbol: symbol,
    };

    // Add optional fields if provided
    if (standardUnit) unitData.standardUnit = standardUnit;

    const unit = await Unit.create(unitData);
    return res.status(201).json(unit);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add unit" });
  }
};

// -------------------------
// PUT /units/:id
// -------------------------
exports.updateUnit = async (req, res) => {
  try {
    const { name, baseUnit, standardUnit, symbol } = req.body;
    
    if (!name || !baseUnit || !symbol) {
      return res.status(400).json({ error: "name, baseUnit & symbol are required" });
    }

    // Validate baseUnit is one of the allowed values
    const allowedBaseUnits = ['kg', 'liter', 'pieces'];
    if (!allowedBaseUnits.includes(baseUnit)) {
      return res.status(400).json({ error: "baseUnit must be one of: kg, liter, pieces" });
    }

    const updateData = {
      name,
      baseUnit,
      symbol: symbol,
    };

    // Add optional fields if provided
    if (standardUnit) updateData.standardUnit = standardUnit;

    const updated = await Unit.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Unit not found" });

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update unit" });
  }
};

// -------------------------
// DELETE /units/:id
// -------------------------
exports.deleteUnit = async (req, res) => {
  try {
    const deleted = await Unit.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Unit not found" });

    return res.status(200).json({ message: "Unit deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete unit" });
  }
};
