const Branch = require('../models/Branch');

exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    res.status(200).json(branches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
};

exports.addBranch = async (req, res) => {
  try {
    const newBranch = new Branch({ name: req.body.name, code: req.body.code });
    await newBranch.save();
    res.status(201).json(newBranch);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add branch' });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const updatedBranch = await Branch.findByIdAndUpdate(req.params.id, { name: req.body.name, code: req.body.code }, { new: true });
    res.status(200).json(updatedBranch);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update branch' });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    await Branch.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Branch deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete branch' });
  }
};
