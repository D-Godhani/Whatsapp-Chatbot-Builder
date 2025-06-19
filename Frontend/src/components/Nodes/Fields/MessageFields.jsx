// src/components/fields/MessageFields.jsx
import React from "react";
import { DefaultField } from "./DefaultField";
import { BooleanField } from "./BooleanField";

export function MessageFields({ formData, onChange }) {
  return (
    <>
      <DefaultField
        formData={formData}
        onChange={onChange}
        fieldKey="message"
        label="Message Text"
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
