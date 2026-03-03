// src/services/AddressService.js
const User = require('../models/User');
const Address = require('../models/Address');

const getUserAddresses = async (userId) => {
  const user = await User.findById(userId).populate('addresses');
  return user.addresses || [];
};

const addAddress = async (userId, addressData) => {
  const newAddress = new Address(addressData);
  await newAddress.save();

  // Add to user's address list
  await User.findByIdAndUpdate(userId, {
    $push: { addresses: newAddress._id }
  });

  return newAddress;
};

const updateAddress = async (userId, addressId, updateData) => {
  // Verify ownership: check if addressId is in user's addresses
  const user = await User.findById(userId);
  if (!user.addresses.includes(addressId)) {
    throw new Error("You don't own this address");
  }

  const updated = await Address.findByIdAndUpdate(addressId, updateData, {
    new: true,
    runValidators: true
  });

  if (!updated) throw new Error("Address not found");
  return updated;
};

const deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user.addresses.includes(addressId)) {
    throw new Error("You don't own this address");
  }

  // Remove from Address collection
  const result = await Address.deleteOne({ _id: addressId });
  if (result.deletedCount === 0) {
    throw new Error("Address not found");
  }

  // Remove from user's address list
  await User.findByIdAndUpdate(userId, {
    $pull: { addresses: addressId }
  });
};

module.exports = {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress
};