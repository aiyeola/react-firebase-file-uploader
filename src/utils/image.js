// @flow
import addToBlobPolyfill from "./polyfill";

/**
 * Resizes and crops an image file to specified dimensions while maintaining aspect ratio
 * @param {File} file - The image file to resize and crop
 * @param {number} [w] - The maximum width of the output image
 * @param {number} [h] - The maximum height of the output image
 * @returns {Promise<Blob>} A promise that resolves with the resized and cropped image blob
 */
export default function resizeAndCropImage(file, w, h) {
  if (!HTMLCanvasElement.prototype.toBlob) {
    addToBlobPolyfill();
  }

  return new Promise((resolve, reject) => {
    // Create file reader
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      // Create image object
      const image = new Image();
      image.onload = () => {
        // Create canvas or use provided canvas
        const canvas = document.createElement("canvas");
        const maxWidth = w || image.width;
        const maxHeight = h || image.height;
        canvas.width = maxWidth;
        canvas.height = maxHeight;

        // Calculate scaling
        const horizontalScale = maxWidth / image.width;
        const verticalScale = maxHeight / image.height;
        const scale = Math.max(horizontalScale, verticalScale);

        // Calculate cropping
        const [width, height] = [scale * image.width, scale * image.height];
        const verticalOffset = Math.min((maxHeight - height) / 2, 0);
        const horizontalOffset = Math.min((maxWidth - width) / 2, 0);

        // Obtain the context for a 2d drawing
        const context = canvas.getContext("2d");
        if (!context) {
          return reject(
            new Error("Could not get the context of the canvas element"),
          );
        }

        // Draw the resized and cropped image
        context.drawImage(
          image,
          horizontalOffset,
          verticalOffset,
          width,
          height,
        );

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob from canvas"));
            return;
          }
          resolve(blob);
        }, file.type);
      };

      // Handle image load errors
      image.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      // Set image source from reader result
      image.src = readerEvent.target.result;
    };

    // Handle reader errors
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    // Start reading the file
    reader.readAsDataURL(file);
  });
}
