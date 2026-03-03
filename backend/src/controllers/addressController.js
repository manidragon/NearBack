// src/controllers/addressController.js
const AddressService = require('../services/AddressService');

const getUserAddresses = async (req, res) => {
  try {
    // req.user is attached by authMiddleware
    const addresses = await AddressService.getUserAddresses(req.user._id);
    return res.status(200).json(addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addAddress = async (req, res) => {
  try {
    const address = await AddressService.addAddress(req.user._id, req.body);
    return res.status(201).json(address);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updated = await AddressService.updateAddress(req.user._id, addressId, req.body);
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    await AddressService.deleteAddress(req.user._id, addressId);
    return res.status(204).send(); // No content
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress
};