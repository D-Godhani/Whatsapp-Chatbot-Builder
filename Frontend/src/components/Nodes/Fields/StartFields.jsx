// src/components/fields/StartFields.jsx
import React from "react";
import { DefaultField } from "./DefaultField";
import { BooleanField } from "./BooleanField";
import { ArrayInput } from "./ArrayInput";
import { X } from "lucide-react";
export function StartFields({ formData, onChange }) {
  return (
    <>
      <DefaultField
        formData={formData}
        onChange={onChange}
        label={"Quick Reply"}
        fieldKey="quickReply"
        showVariableDropdown={true}
      />
      <BooleanField
        formData={formData}
        onChange={onChange}
        fieldKey="waitForReply"
        label="Wait for user reply"
      />
    </>
  );
}
