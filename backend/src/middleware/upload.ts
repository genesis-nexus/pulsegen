import multer from 'multer';
import path from 'path';

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter for images only
const imageFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed.'));
  }
};

// Configure multer
export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: imageFileFilter,
});

// Export specific upload configurations
export const uploadLogo = uploadImage.single('logo');
export const uploadFavicon = uploadImage.single('favicon');
export const uploadBackground = uploadImage.single('background');
export const uploadBrandingImages = uploadImage.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]);
