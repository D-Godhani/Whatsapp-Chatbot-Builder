// src/components/fields/BooleanField.jsx
import React from "react";

export function BooleanField({ fieldKey, label, formData, onChange }) {
  const isChecked =
    formData[fieldKey] === true || formData[fieldKey] === "true";

  const handleChange = (e) => {
    onChange(fieldKey, e.target.checked);
  };

  return (
    <div className="flex items-center gap-2 my-4 p-3 border-none rounded-md bg-gray-200">
      <input
        id={fieldKey}
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
      />
      <label htmlFor={fieldKey} className="text-sm font-medium text-gray-800">
        {label}
      </label>
    </div>
  );
}
