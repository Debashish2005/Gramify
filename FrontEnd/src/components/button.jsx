import React from "react";

export const Button = ({
  children,
  className = "",
  onClick,
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-6 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition duration-200 shadow-md ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
