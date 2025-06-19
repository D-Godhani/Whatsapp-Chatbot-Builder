import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { NodeFieldRenderer } from "./NodeFieldRenderer";
import { getInitialFields, getNodeCategory } from "./node-config";

function BaseNodeDialog({ node, onClose, onSave, onDelete }) {
  if (!node) return null;

  const nodeType = getNodeCategory(node.type);

  const [formData, setFormData] = useState({});

  useEffect(() => {
    const initialFields = getInitialFields(nodeType) || {};
    const existing = node.data?.properties || {};

    const filteredExisting = Object.fromEntries(
      Object.entries(existing).filter(
        ([key]) => key !== "isSelected" && key !== "fields"
      )
    );
    setFormData({ ...initialFields, ...filteredExisting });
  }, [node, nodeType]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      ...node,
      data: {
        ...node.data,
        properties: formData,
      },
    });
    onClose();
  };

  return (
    <div
      className="absolute inset-0 bg-opacity-30 z-50 flex justify-end items-end p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-opacity-30 backdrop-grayscale-75 z-0"></div>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white p-6 rounded-lg shadow-lg shadow-indigo-900 w-[500px] max-h-[90vh] overflow-y-auto relative animate-slide-in-right"
      >
        <button
          onClick={() => {
            onDelete(node.id);
            onClose();
          }}
          className="absolute rounded-md p-1 m-1 top-4 right-4 border-2 border-black transition-all duration-300 text-white bg-red-500 hover:bg-red-900"
        >
          <Trash2 className="w-6 h-6" />
        </button>

        <h2 className="text-lg font-bold mb-4">Edit Node: {node.data.label}</h2>

        <NodeFieldRenderer
          nodeType={nodeType}
          formData={formData}
          onChange={handleChange}
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 rounded-md text-white hover:bg-red-800 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-900 transition-all duration-300"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default BaseNodeDialog;
