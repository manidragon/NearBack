// backend/src/controllers/ReturnImageController.js
const cloudinary = require('cloudinary').v2;
const ReturnRequest = require('../models/ReturnRequest');

class ReturnImageController {
  
  // ✅ Upload return proof images to Cloudinary
  async uploadReturnImages(req, res) {
    try {
      const { returnId } = req.params;
      const files = req.files; // From multer middleware
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
      }
      
      // ✅ Validate return exists and belongs to user
      const returnRequest = await ReturnRequest.findById(returnId)
        .populate('customer');
      
      if (!returnRequest) {
        return res.status(404).json({ error: 'Return request not found' });
      }
      
      // ✅ Authorization: Only customer or seller can upload
      const userId = req.user?._id || req.seller?._id;
      const isCustomer = returnRequest.customer._id.toString() === userId?.toString();
      const isSeller = returnRequest.seller.toString() === userId?.toString();
      
      if (!isCustomer && !isSeller) {
        return res.status(403).json({ error: 'Unauthorized to upload images for this return' });
      }
      
      // ✅ Upload to Cloudinary
      const uploadPromises = files.map(file => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload(file.path, {
            folder: 'return-proofs',
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' }, // Limit max dimensions
              { quality: 'auto:good' } // Optimize quality
            ]
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          });
        });
      });
      
      const imageUrls = await Promise.all(uploadPromises);
      
      // ✅ Update return request with new images
      returnRequest.images = [...(returnRequest.images || []), ...imageUrls].slice(0, 5); // Max 5
      returnRequest.updatedAt = new Date();
      await returnRequest.save();
      
      console.log('✅ Return images uploaded:', {
        returnId,
        count: imageUrls.length,
        urls: imageUrls.map(url => url.slice(0, 50) + '...')
      });
      
      res.status(200).json({
        success: true,
        message: `${imageUrls.length} image(s) uploaded successfully`,
        images: imageUrls
      });
      
    } catch (error) {
      console.error('❌ ReturnImageController.uploadReturnImages error:', error);
      res.status(500).json({ error: 'Failed to upload images' });
    }
  }
  
  // ✅ Delete return image (optional, for moderation)
  async deleteReturnImage(req, res) {
    try {
      const { returnId, imageIndex } = req.params;
      
      const returnRequest = await ReturnRequest.findById(returnId);
      if (!returnRequest) {
        return res.status(404).json({ error: 'Return request not found' });
      }
      
      // ✅ Authorization check (same as upload)
      const userId = req.user?._id || req.seller?._id;
      const isCustomer = returnRequest.customer?.toString() === userId?.toString();
      const isSeller = returnRequest.seller?.toString() === userId?.toString();
      
      if (!isCustomer && !isSeller) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // ✅ Remove image from array
      if (imageIndex >= 0 && imageIndex < returnRequest.images.length) {
        const imageUrl = returnRequest.images[imageIndex];
        
        // ✅ Optional: Delete from Cloudinary
        try {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`return-proofs/${publicId}`);
        } catch (cloudErr) {
          console.warn('⚠️ Could not delete from Cloudinary:', cloudErr.message);
          // Continue anyway - DB update is more important
        }
        
        returnRequest.images.splice(imageIndex, 1);
        returnRequest.updatedAt = new Date();
        await returnRequest.save();
        
        console.log('✅ Return image deleted:', { returnId, index: imageIndex });
        
        res.status(200).json({
          success: true,
          message: 'Image deleted successfully',
          remainingImages: returnRequest.images.length
        });
      } else {
        res.status(400).json({ error: 'Invalid image index' });
      }
      
    } catch (error) {
      console.error('❌ ReturnImageController.deleteReturnImage error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }
}

module.exports = new ReturnImageController();