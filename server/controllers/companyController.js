const Company = require('../models/Company');

const getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id }).populate('user', '-password');
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findOneAndUpdate(
      { user: req.user.id },
      { ...req.body },
      { new: true }
    );
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().populate('user', '-password');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCompanyProfile, updateCompanyProfile, getAllCompanies };