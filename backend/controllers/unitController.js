// controllers/unitController.js
const Unit = require("../models/Units");

// -------------------------
// GET  /units
// -------------------------
exports.getUnit = async (req, res) => {
  try {
    const { unitType } = req.query;
    let query = {};
    
    // If unitType is specified, filter by it
    if (unitType) {
      query.unitType = unitType;
    }
    
    const units = await Unit.find(query);
    return res.status(200).json(units);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch units" });
  }
};

// -------------------------
// GET  /units/branch
// -------------------------
exports.getBranchUnits = async (req, res) => {
  try {
    const units = await Unit.find({ unitType: 'Branch Unit' });
    return res.status(200).json(units);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch branch units" });
  }
};

// -------------------------
// POST /units
// -------------------------
exports.addUnit = async (req, res) => {
  try {
    const { name, baseUnit, unitType, standardUnit, symbol } = req.body;
    
    if (!name || !baseUnit || !unitType || !symbol) {
      return res.status(400).json({ error: "name, baseUnit, unitType & symbol are required" });
    }

    // Validate baseUnit is one of the allowed values
    const allowedBaseUnits = ['kg', 'liter', 'pieces'];
    if (!allowedBaseUnits.includes(baseUnit)) {
      return res.status(400).json({ error: "baseUnit must be one of: kg, liter, pieces" });
    }

    // Validate unitType is one of the allowed values
    const allowedUnitTypes = ['Branch Unit', 'Standard Unit'];
    if (!allowedUnitTypes.includes(unitType)) {
      return res.status(400).json({ error: "unitType must be one of: Branch Unit, Standard Unit" });
    }

    const unitData = {
      name,
      baseUnit,
      unitType,
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
    const { name, baseUnit, unitType, standardUnit, symbol } = req.body;
    
    if (!name || !baseUnit || !unitType || !symbol) {
      return res.status(400).json({ error: "name, baseUnit, unitType & symbol are required" });
    }

    // Validate baseUnit is one of the allowed values
    const allowedBaseUnits = ['kg', 'liter', 'pieces'];
    if (!allowedBaseUnits.includes(baseUnit)) {
      return res.status(400).json({ error: "baseUnit must be one of: kg, liter, pieces" });
    }

    // Validate unitType is one of the allowed values
    const allowedUnitTypes = ['Branch Unit', 'Standard Unit'];
    if (!allowedUnitTypes.includes(unitType)) {
      return res.status(400).json({ error: "unitType must be one of: Branch Unit, Standard Unit" });
    }

    const updateData = {
      name,
      baseUnit,
      unitType,
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
