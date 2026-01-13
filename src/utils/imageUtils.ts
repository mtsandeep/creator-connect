// ============================================
// IMAGE UTILITIES
// ============================================

/**
 * Resize an image to fit within specified dimensions while maintaining aspect ratio
 * @param file - The image file to resize
 * @param maxHeight - Maximum height in pixels (width scales proportionally)
 * @param quality - JPEG quality (0-1, default 0.8)
 * @returns Promise<File> - Resized image file
 */
export function resizeImage(file: File, maxHeight: number = 150, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        const ratio = Math.min(maxHeight / img.height, 1); // Don't upscale
        const width = img.width * ratio;
        const height = img.height * ratio;

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob and create File
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const baseName = file.name.replace(/\.[^/.]+$/, '');
              const resizedFile = new File([blob], `${baseName}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize multiple images in parallel
 * @param files - Array of image files
 * @param maxHeight - Maximum height in pixels
 * @param quality - JPEG quality
 * @returns Promise<File[]> - Array of resized image files
 */
export function resizeImages(files: File[], maxHeight: number = 150, quality: number = 0.8): Promise<File[]> {
  return Promise.all(files.map(file => resizeImage(file, maxHeight, quality)));
}

/**
 * Check if file needs resizing (based on dimensions)
 * @param file - Image file to check
 * @param maxHeight - Maximum height to check against
 * @returns Promise<boolean> - True if image needs resizing
 */
export function needsResizing(file: File, maxHeight: number = 150): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.height > maxHeight);
    };
    img.onerror = () => resolve(false); // If we can't load, don't resize
    img.src = URL.createObjectURL(file);
  });
}
