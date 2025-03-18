/**
 * FirebaseFileUploader for React
 * @flow
 */

import React, { Component } from "react";
import { v4 as generateRandomID } from "uuid";
import { ref, uploadBytesResumable } from "firebase/storage";
import resizeAndCropImage from "./utils/image";

const generateRandomFilename = () => generateRandomID();

function extractExtension(filename) {
  const ext = /(?:\.([^.]+))?$/.exec(filename);
  if (ext != null && ext[0] != null) {
    return ext[0];
  }
  return "";
}

/**
 * @typedef {Object} Props
 * @property {import('firebase/storage').StorageReference} storageRef - Firebase storage reference
 * @property {function(File, import('firebase/storage').UploadTask): void} [onUploadStart] - Called when upload starts
 * @property {function(number, import('firebase/storage').UploadTask): void} [onProgress] - Called during upload progress
 * @property {function(string, import('firebase/storage').UploadTask): void} [onUploadSuccess] - Called on successful upload
 * @property {function(Error, import('firebase/storage').UploadTask): void} [onUploadError] - Called on upload error
 * @property {(string|function(File): string)} [filename] - Custom filename or function to generate one
 * @property {Object} [metadata] - Firebase storage metadata
 * @property {boolean} [randomizeFilename] - Whether to randomize the filename
 * @property {*} [as] - Custom component to render instead of input
 * @property {number} [maxWidth] - Max width for image resize
 * @property {number} [maxHeight] - Max height for image resize
 * @property {Object} [style] - CSS styles
 * @property {boolean} [hidden] - Whether to hide the input
 * @property {string} [id] - Input id
 * @property {string} [accept] - Input accept attribute
 * @property {boolean} [disabled] - Input disabled attribute
 * @property {string} [form] - Input form attribute
 * @property {boolean} [formNoValidate] - Input formNoValidate attribute
 * @property {string} [name] - Input name attribute
 * @property {boolean} [readOnly] - Input readOnly attribute
 * @property {boolean} [required] - Input required attribute
 * @property {string} [value] - Input value attribute
 * @property {boolean} [multiple] - Input multiple attribute
 */

class FirebaseFileUploader extends Component {
  constructor(props) {
    super(props);
    this.uploadTasks = [];
  }

  componentWillUnmount() {
    this.cancelRunningUploads();
  }

  cancelRunningUploads() {
    while (this.uploadTasks.length > 0) {
      const task = this.uploadTasks.pop();
      if (task && task.snapshot.state === "running") {
        task.cancel();
      }
    }
  }

  removeTask(task) {
    const index = this.uploadTasks.indexOf(task);
    if (index !== -1) {
      this.uploadTasks.splice(index, 1);
    }
  }

  async startUpload(file) {
    const {
      onUploadStart,
      storageRef,
      metadata,
      randomizeFilename,
      filename,
      maxWidth,
      maxHeight
    } = this.props;

    let filenameToUse;
    if (filename) {
      filenameToUse =
        typeof filename === "function" ? filename(file) : filename;
    } else {
      filenameToUse = randomizeFilename ? generateRandomFilename() : file.name;
    }

    // Ensure there is an extension in the filename
    if (!extractExtension(filenameToUse)) {
      filenameToUse += extractExtension(file.name);
    }

    try {
      // Handle image resizing if needed
      const processedFile =
        file.type.match(/image.*/) && (maxWidth || maxHeight)
          ? await resizeAndCropImage(file, maxWidth, maxHeight)
          : file;

      // Create the file reference and start upload
      const fileRef = ref(storageRef, filenameToUse);
      const uploadTask = uploadBytesResumable(fileRef, processedFile, metadata);

      if (onUploadStart) {
        onUploadStart(processedFile, uploadTask);
      }

      // Track upload progress and handle events
      uploadTask.on(
        "state_changed",
        snapshot => {
          if (this.props.onProgress) {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            this.props.onProgress(progress, uploadTask);
          }
        },
        error => {
          this.removeTask(uploadTask);
          if (this.props.onUploadError) {
            this.props.onUploadError(error, uploadTask);
          }
        },
        () => {
          this.removeTask(uploadTask);
          if (this.props.onUploadSuccess) {
            this.props.onUploadSuccess(
              uploadTask.snapshot.metadata.name,
              uploadTask
            );
          }
        }
      );

      this.uploadTasks.push(uploadTask);
    } catch (error) {
      if (this.props.onUploadError) {
        this.props.onUploadError(error, null);
      }
    }
  }

  handleFileSelection = event => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => this.startUpload(file));
    }
  };

  render() {
    const {
      storageRef,
      onUploadStart,
      onProgress,
      onUploadSuccess,
      onUploadError,
      randomizeFilename,
      metadata,
      filename,
      maxWidth,
      maxHeight,
      hidden,
      as: Input = "input",
      ...props
    } = this.props;

    const inputStyle = hidden
      ? {
          ...props.style,
          width: "0.1px",
          height: "0.1px",
          opacity: 0,
          overflow: "hidden",
          position: "absolute",
          zIndex: -1
        }
      : props.style || {};

    const InputComponent = Input;
    return (
      <InputComponent
        type="file"
        onChange={this.handleFileSelection}
        {...props}
        style={inputStyle}
      />
    );
  }
}

export default FirebaseFileUploader;
