const Section = require('../models/Section');
const Branch = require('../models/Branch');

// GET all sections
exports.getSections = async (req, res) => {
  try {
    const sections = await Section.find()
      .populate('branch', 'name code')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single section by ID
exports.getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('branch', 'name code')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    res.json(section);
  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST create new section
exports.createSection = async (req, res) => {
  try {
    const { name, code, description, isActive, branch, sectionType } = req.body;

    // Check if section with same name or code already exists
    const existingSection = await Section.findOne({
      $or: [{ name }, { code }]
    });

    if (existingSection) {
      return res.status(400).json({ 
        message: 'Section with this name or code already exists' 
      });
    }

    // Validate branch if provided
    if (branch) {
      const branchExists = await Branch.findById(branch);
      if (!branchExists) {
        return res.status(400).json({ message: 'Invalid branch ID' });
      }
    }

    const section = new Section({
      name,
      code,
      description,
      isActive: isActive !== undefined ? isActive : true,
      branch,
      sectionType: sectionType || 'standard',
      createdBy: req.user?.id
    });

    const savedSection = await section.save();
    
    const populatedSection = await Section.findById(savedSection._id)
      .populate('branch', 'name code')
      .populate('createdBy', 'name');

    res.status(201).json(populatedSection);
  } catch (error) {
    console.error('Error creating section:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT update section
exports.updateSection = async (req, res) => {
  try {
    const { name, code, description, isActive, branch, sectionType } = req.body;

    // Check if section exists
    const existingSection = await Section.findById(req.params.id);
    if (!existingSection) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Check if name or code conflicts with other sections
    const conflictSection = await Section.findOne({
      $or: [{ name }, { code }],
      _id: { $ne: req.params.id }
    });

    if (conflictSection) {
      return res.status(400).json({ 
        message: 'Section with this name or code already exists' 
      });
    }

    // Validate branch if provided
    if (branch) {
      const branchExists = await Branch.findById(branch);
      if (!branchExists) {
        return res.status(400).json({ message: 'Invalid branch ID' });
      }
    }

    const updateData = {
      name,
      code,
      description,
      isActive: isActive !== undefined ? isActive : true,
      branch,
      sectionType: sectionType || 'standard',
      updatedBy: req.user?.id
    };

    const updatedSection = await Section.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('branch', 'name code')
     .populate('createdBy', 'name')
     .populate('updatedBy', 'name');

    res.json(updatedSection);
  } catch (error) {
    console.error('Error updating section:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE section
exports.deleteSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    await Section.findByIdAndDelete(req.params.id);
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET active sections only
exports.getActiveSections = async (req, res) => {
  try {
    const sections = await Section.find({ isActive: true })
      .populate('branch', 'name code')
      .sort({ name: 1 });
    
    res.json(sections);
  } catch (error) {
    console.error('Error fetching active sections:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 