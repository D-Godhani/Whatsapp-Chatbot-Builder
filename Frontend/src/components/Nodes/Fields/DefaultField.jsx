import React from "react";
import VariableInsertDropdown from "./VariableDropDownField";

export function DefaultField({
  formData,
  onChange,
  fieldKey,
  label,
  showVariableDropdown = true,
}) {
  const displayLabel = label || fieldKey.replace(/([a-z])([A-Z])/g, "$1 $2");

  const handleVariableInsert = (variable) => {
    const current = formData[fieldKey] || "";
    onChange(fieldKey, current + variable);
  };

  return (
    <div className="mb-4">
      <label className="text-sm font-medium capitalize block mb-1">
        {displayLabel}
      </label>

      {/* {showVariableDropdown && (
        <VariableInsertDropdown onInsert={handleVariableInsert} />
      )} */}
      <div className="flex gap-2 items-center px-2 border border-gray-300 rounded-md">
        <input
          type="text"
          value={formData[fieldKey] ?? ""}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="h-10 w-full "
        />
        {showVariableDropdown && (
          <VariableInsertDropdown onInsert={handleVariableInsert} />
        )}
      </div>
    </div>
  );
}
