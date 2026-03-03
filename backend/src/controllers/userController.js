// D:\Mani\Code with Zosh\Backup\source code\backend\src\controllers\userController.js
const UserService = require('../services/UserService');
const UserError = require('../exceptions/UserError');

const getUserProfileByJwt = async (req, res) => {
    try {
        
        const user = await req.user;
        return res.status(200).json(user);
    } catch (err) {
        handleErrors(err, res);
    }
};

const getUserByEmail = async (req, res) => {
    const { email } = req.query; 
    try {
        const user = await UserService.findUserByEmail(email);
        return res.status(200).json(user);
    } catch (err) {
        handleErrors(err, res);
    }
};

const updateUserProfile = async (req, res) => {
   try {
        const { fullName, mobile } = req.body;
        
        console.log('🔄 updateUserProfile - Request body:', req.body); // ✅ Debug log
        console.log('🔄 updateUserProfile - User ID:', req.user._id); // ✅ Debug log
        
        // Validate input
        if (!fullName && !mobile) {
            return res.status(400).json({ message: 'At least one field is required' });
        }

        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (mobile) updateData.mobile = mobile;

        console.log('🔄 updateUserProfile - Update data:', updateData); // ✅ Debug log

        const updatedUser = await UserService.updateUserProfile(req.user._id, updateData);
        
        console.log('✅ updateUserProfile - Updated user:', updatedUser); // ✅ Debug log
        return res.status(200).json(updatedUser);
    } catch (err) {
        console.error('❌ updateUserProfile - Error:', err); // ✅ Error log
        handleErrors(err, res);
    }
};

// ✅ Add update profile picture
const updateProfilePicture = async (req, res) => {
     try {
        const { imageUrl } = req.body;
        
        console.log('🔄 updateProfilePicture - Request body:', req.body); // ✅ Debug log
        console.log('🔄 updateProfilePicture - User ID:', req.user._id); // ✅ Debug log
        
        if (!imageUrl) {
            return res.status(400).json({ message: 'Image URL is required' });
        }

        const updatedUser = await UserService.updateProfilePicture(req.user._id, imageUrl);
        
        console.log('✅ updateProfilePicture - Updated user:', updatedUser); // ✅ Debug log
        return res.status(200).json(updatedUser);
    } catch (err) {
        console.error('❌ updateProfilePicture - Error:', err); // ✅ Error log
        handleErrors(err, res);
    }
};



const handleErrors = (err, res) => {
    if (err instanceof UserError) {
        return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
};

// Export the controller methods
module.exports = {
    getUserProfileByJwt,
    getUserByEmail,
    updateUserProfile,
    updateProfilePicture
};
