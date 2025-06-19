import React from "react";
import {
  Save,
  RotateCw,
  Eye,
  Download,
  Send,
  SendHorizonal,
} from "lucide-react";

export default function FlowBuilderRightSidebar({ onReset, onSave }) {
  const handleSave = () => {
    onSave();
  };

  const handleReset = () => {
    onReset();
  };

  const handlePreview = () => {
    console.log("Preview button clicked");
  };

  const handleExport = () => {
    console.log("Export button clicked");
  };

  const handlePublish = () => {
    console.log("Publish button clicked");
  };

  return (
    <div className="absolute top-0 right-0 h-full w-20 z-10 bg-white shadow-md p-2 transition-all duration-300 flex flex-col items-center">
      <div className="w-full flex justify-center items-center mb-4">
        <h1 className="text-md font-bold text-center w-full">Flow Builder</h1>
      </div>

      {[
        {
          label: "Save",
          icon: <Save className="w-5 h-5" />,
          onClick: handleSave,
        },
        {
          label: "Reset",
          icon: <RotateCw className="w-5 h-5" />,
          onClick: handleReset,
        },
        {
          label: "Preview",
          icon: <Eye className="w-5 h-5" />,
          onClick: handlePreview,
        },
        {
          label: "Export",
          icon: <Download className="w-5 h-5" />,
          onClick: handleExport,
        },
        {
          label: "Publish",
          icon: <SendHorizonal className="w-5 h-5" />,
          onClick: handlePublish,
        },
      ].map((btn, idx) => (
        <div key={idx} className="flex flex-col items-center mb-4 w-full">
          <button
            className="flex justify-center items-center w-12 h-12 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-300"
            onClick={btn.onClick}
          >
            {btn.icon}
          </button>
          <span className="text-xs mt-1 text-center">{btn.label}</span>
        </div>
      ))}
    </div>
  );
}
