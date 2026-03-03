// D:\Mani\Code with Zosh\Backup\source code\backend\src\services\UserService.js
const User = require('../models/User');
const jwtProvider = require('../utils/jwtProvider');
const UserError = require('../exceptions/UserError');

class UserService {


    async findUserProfileByJwt(jwt) {
        const email = jwtProvider.getEmailFromJwt(jwt)

        const user = await User.findOne({ email }).populate("addresses");
        if (!user) {
            throw new UserError(`User does not exist with email ${email}`);
        }
        return user;
    }

    async findUserByEmail(email) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new UserException(`User does not exist with email ${email}`);
        }
        return user;
    }

 // ✅ FIX: Use findOneAndUpdate for reliable updates
    async updateUserProfile(userId, updateData) {
        console.log('🔄 UserService.updateUserProfile - userId:', userId);
        console.log('🔄 UserService.updateUserProfile - updateData:', updateData);
        
        // ✅ Use findOneAndUpdate with new: true to return updated document
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            updateData,
            { 
                new: true,      // Return the updated document
                runValidators: true, // Run schema validators
                select: '-password' // Exclude password
            }
        );
        
        if (!updatedUser) {
            throw new UserError('User not found');
        }

        console.log('✅ UserService.updateUserProfile - Updated user:', updatedUser);
        
        return updatedUser;
    }

    // ✅ FIX: Use findOneAndUpdate for profile picture
    async updateProfilePicture(userId, imageUrl) {
        console.log('🔄 UserService.updateProfilePicture - userId:', userId);
        console.log('🔄 UserService.updateProfilePicture - imageUrl:', imageUrl);
        
        // ✅ Use findOneAndUpdate with new: true
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { profilePicture: imageUrl },
            { 
                new: true,
                select: '-password'
            }
        );
        
        if (!updatedUser) {
            throw new UserError('User not found');
        }

        console.log('✅ UserService.updateProfilePicture - Updated user:', updatedUser);
        
        return updatedUser;
    }
}

module.exports = new UserService();
