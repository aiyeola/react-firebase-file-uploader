import React from "react";
import FirebaseFileUploader from "./index";

/**
 * @typedef {import('./index').Props} UploaderProps
 * @typedef {Object} CustomButtonProps
 * @property {Object} [style] - Custom styles for the button
 * @property {string} [className] - CSS class name
 * @property {string} [htmlFor] - Label's htmlFor attribute
 * @property {string} [id] - Button ID
 * @property {React.ReactNode} [children] - Button content
 */

/**
 * A custom button wrapper for FirebaseFileUploader
 * @param {UploaderProps & CustomButtonProps} props - Component props
 * @returns {React.ReactElement}
 */
const CustomUploadButton = props => {
  const {
    style,
    className,
    children,
    htmlFor = props.id,
    ...inputProps
  } = props;

  const buttonStyle = {
    cursor: "pointer",
    ...style
  };

  return (
    <label style={buttonStyle} className={className} htmlFor={htmlFor}>
      {children}
      <FirebaseFileUploader hidden {...inputProps} />
    </label>
  );
};

export default CustomUploadButton;
