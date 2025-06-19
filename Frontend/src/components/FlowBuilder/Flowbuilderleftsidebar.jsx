import React from "react";
import { Zap, ListChecks, CheckCircle2 } from "lucide-react";
import nodeTypes from "../Nodes/NodeTypes";
import { getNodeLabel } from "../Nodes/node-config";
import {
  TriggerNodes,
  ConditionNodes,
  ActionNodes,
} from "../Nodes/node-config";
export default function FlowBuilderLeftSidebar({ onAddNode }) {
  return (
    <div className="absolute top-0 left-0 h-full w-20 z-10 bg-white shadow-md p-2 transition-all duration-300 flex flex-col items-center">
      <div className="w-full flex justify-center items-center mb-4">
        <h1 className="text-md font-bold text-center w-full">Node Selector</h1>
      </div>

      {[
        {
          label: "Trigger",
          icon: <Zap className="w-5 h-5" />,
          options: TriggerNodes,
        },
        {
          label: "Condition",
          icon: <ListChecks className="w-5 h-5" />,
          options: ConditionNodes,
        },
        {
          label: "Action",
          icon: <CheckCircle2 className="w-5 h-5" />,
          options: ActionNodes,
        },
      ].map((section, idx) => (
        <div
          key={idx}
          className="relative group mb-4 w-full flex flex-col items-center"
        >
          <button className="flex justify-center items-center w-12 h-12 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-300">
            {section.icon}
          </button>
          <span className="text-xs mt-1 text-center">{section.label}</span>

          {/* Hover Popup for Node Options */}
          <div className="absolute top-0 left-full w-max  bg-white border rounded shadow-lg opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 scale-95 group-hover:scale-100 transition-all duration-300 z-20 pointer-events-none group-hover:pointer-events-auto ">
            <ul className="text-sm py-2">
              {section.options.map((item, i) => (
                <li
                  key={i}
                  className="px-2 py-2 rounded-xl hover:bg-indigo-500 cursor-pointer bg-indigo-200 m-2 hover:text-white transition-all duration-300"
                  onClick={() => onAddNode(item)}
                >
                  {getNodeLabel(item)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
