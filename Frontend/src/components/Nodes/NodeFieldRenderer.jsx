// components/NodeFieldRenderer.jsx
import React from "react";
import { DefaultField } from "./Fields/DefaultField";
import { ButtonsFields } from "./Fields/ButtonsFields";
import { KeywordMatchFields } from "./Fields/KeywordMatchFields";
import { ApiCallFields } from "./Fields/ApiCallFields";
import { AskAQuestionFields } from "./Fields/AskAQuestionFields";
import { MessageFields } from "./Fields/MessageFields";
import { StartFields } from "./Fields/StartFields";

// Map node types to their corresponding field-rendering component.
const FIELD_RENDERER_MAP = {
  start: StartFields,
  message: MessageFields,
  buttons: ButtonsFields,
  keywordMatch: KeywordMatchFields,
  apiCall: ApiCallFields,
  askaQuestion: AskAQuestionFields,
  end: (props) => <DefaultField {...props} fieldKey="quickReply" />,
};

export function NodeFieldRenderer({ nodeType, formData, onChange }) {
  // Find the specific component for the node type.
  const FieldComponent = FIELD_RENDERER_MAP[nodeType];

  if (!FieldComponent) {
    return (
      <p className="mb-2 text-sm text-gray-500">
        No editable fields for this node.
      </p>
    );
  }

  return <FieldComponent formData={formData} onChange={onChange} />;
}
