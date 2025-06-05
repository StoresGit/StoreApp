const Role = require('../models/Currency');

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

exports.addRole = async (req, res) => {
  try {
    const newRole = new Role({ currencyName: req.body.currencyName, symbol: req.body.symbol });
    await newRole.save();
    res.status(201).json(newRole);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add role' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const updatedRole = await Role.findByIdAndUpdate(req.params.id, { currencyName: req.body.currencyName, symbol: req.body.symbol }, { new: true });
    res.status(200).json(updatedRole);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete role' });
  }
};
