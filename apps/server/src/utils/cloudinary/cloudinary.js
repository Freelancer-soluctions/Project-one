import { v2 as cloudinary } from 'cloudinary';
import dotenv from '../../config/dotenv.js';
cloudinary.config({
  cloud_name: dotenv('CLOUD_NAME'),
  api_key: dotenv('CLOUD_API_KEY'),
  api_secret: dotenv('CLOUD_API_SECRET'),
});

export const handleUpload = async (image) => {
  const { secure_url, public_id } = await cloudinary.uploader.upload(image, {
    overwrite: true,
  });

  return { secure_url, public_id };
};

export const handleUploadUpdate = async (image, publicId) => {
  const { secure_url } = await cloudinary.uploader.upload(image, {
    public_id: publicId,
    invalidate: true,
  });

  return { secure_url };
};

export const handleDeleteFile = async (image) =>
  cloudinary.uploader.destroy(image);
