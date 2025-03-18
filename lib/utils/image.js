"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = resizeAndCropImage;
var _polyfill = _interopRequireDefault(require("./polyfill"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// @flow

/**
 * Resizes and crops an image file to specified dimensions while maintaining aspect ratio
 * @param {File} file - The image file to resize and crop
 * @param {number} [w] - The maximum width of the output image
 * @param {number} [h] - The maximum height of the output image
 * @returns {Promise<Blob>} A promise that resolves with the resized and cropped image blob
 */
function resizeAndCropImage(file, w, h) {
  if (!HTMLCanvasElement.prototype.toBlob) {
    (0, _polyfill["default"])();
  }
  return new Promise(function (resolve, reject) {
    // Create file reader
    var reader = new FileReader();
    reader.onload = function (readerEvent) {
      // Create image object
      var image = new Image();
      image.onload = function () {
        // Create canvas or use provided canvas
        var canvas = document.createElement("canvas");
        var maxWidth = w || image.width;
        var maxHeight = h || image.height;
        canvas.width = maxWidth;
        canvas.height = maxHeight;

        // Calculate scaling
        var horizontalScale = maxWidth / image.width;
        var verticalScale = maxHeight / image.height;
        var scale = Math.max(horizontalScale, verticalScale);

        // Calculate cropping
        var width = scale * image.width,
          height = scale * image.height;
        var verticalOffset = Math.min((maxHeight - height) / 2, 0);
        var horizontalOffset = Math.min((maxWidth - width) / 2, 0);

        // Obtain the context for a 2d drawing
        var context = canvas.getContext("2d");
        if (!context) {
          return reject(new Error("Could not get the context of the canvas element"));
        }

        // Draw the resized and cropped image
        context.drawImage(image, horizontalOffset, verticalOffset, width, height);

        // Convert canvas to blob
        canvas.toBlob(function (blob) {
          if (!blob) {
            reject(new Error("Failed to create blob from canvas"));
            return;
          }
          resolve(blob);
        }, file.type);
      };

      // Handle image load errors
      image.onerror = function () {
        reject(new Error("Failed to load image"));
      };

      // Set image source from reader result
      image.src = readerEvent.target.result;
    };

    // Handle reader errors
    reader.onerror = function () {
      reject(new Error("Failed to read file"));
    };

    // Start reading the file
    reader.readAsDataURL(file);
  });
}