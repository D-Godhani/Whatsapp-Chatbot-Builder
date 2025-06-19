import {
  ReactFlow,
  Background,
  Controls,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";
import CustomEdge from "../Edges/Customedge";
import nodeTypes from "../Nodes/NodeTypes";
import BaseNodeDialog from "../Nodes/Nodedialog";
import EdgeDialog from "../Edges/Edgedialog";
import { X } from "lucide-react";
import { useVariableContext } from "../../context/Variable.context";
const edgeTypes = {
  testingEdge: CustomEdge,
};

function FlowCanvas({ nodes, setNodes, edges, setEdges }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [showLabelPrompt, setShowLabelPrompt] = useState(false);
  const [labelChoice, setLabelChoice] = useState("true");
  const [availableLabels, setAvailableLabels] = useState([]);
  const { syncVariablesFromNodes } = useVariableContext();
  const normalizedEdges = edges.map((edge) => ({
    ...edge,
    type: "testingEdge",
    data: {
      ...edge.data,
      label: edge.data?.label || edge.label || "",
    },
  }));

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((node) => node.id === params.source);

      if (sourceNode?.type === "keywordMatch") {
        const usedLabels = edges
          .filter((e) => e.source === params.source)
          .map((e) => (e.label || e.data?.label)?.toLowerCase());

        const availableOptions = ["true", "false"].filter(
          (opt) => !usedLabels.includes(opt)
        );

        setLabelChoice(availableOptions[0] || "true");
        setAvailableLabels(availableOptions);
        setPendingConnection(params);
        setShowLabelPrompt(true);
      } else if (sourceNode?.type === "buttons") {
        const buttonLabels = sourceNode.data?.properties?.buttons || [];

        const usedLabels = edges
          .filter((e) => e.source === params.source)
          .map((e) => (e.label || e.data?.label)?.toLowerCase());

        const availableOptions = buttonLabels.filter(
          (label) => !usedLabels.includes(label.toLowerCase())
        );

        setLabelChoice(availableOptions[0] || "");
        setAvailableLabels(availableOptions);
        setPendingConnection(params);
        setShowLabelPrompt(true);
      } else {
        setEdges((eds) => addEdge({ ...params, type: "testingEdge" }, eds));
      }
    },
    [nodes, edges, setEdges]
  );

  const handleLabelConfirm = () => {
    setEdges((eds) =>
      addEdge(
        {
          ...pendingConnection,
          type: "testingEdge",
          label: labelChoice,
          data: {
            ...pendingConnection.data,
            label: labelChoice,
          },
        },
        eds
      )
    );
    setPendingConnection(null);
    setShowLabelPrompt(false);
    setLabelChoice("true");
  };

  const handleNodeClick = (event, node) => {
    event.preventDefault();
    setSelectedNode(node);
  };

  const handleEdgeClick = (event, edge) => {
    event.preventDefault();
    setSelectedEdge(edge);
  };

  const handleCloseEdgeDialog = () => {
    setSelectedEdge(null);
  };

  const handleDeleteEdge = (edgeId) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    handleCloseEdgeDialog();
  };

  const handleDeleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    handleCloseNodeDialog();
  };

  const handleCloseNodeDialog = () => {
    setSelectedNode(null);
  };

  const handleSaveNode = (updatedNode) => {
    const oldNode = nodes.find((node) => node.id === updatedNode.id);
    const oldButtons = oldNode?.data?.properties?.buttons || [];
    const newButtons = updatedNode?.data?.properties?.buttons || [];

    const removedButtons = oldButtons.filter(
      (btn) => !newButtons.includes(btn)
    );

    setEdges((prevEdges) =>
      prevEdges.filter((edge) => {
        const edgeLabel = (edge.data?.label || edge.label)
          ?.toString()
          .toLowerCase();
        const sourceMatches = edge.source === updatedNode.id;
        const labelMatches = removedButtons
          .map((btn) => btn.toLowerCase())
          .includes(edgeLabel);

        return !(sourceMatches && labelMatches);
      })
    );

    // Update the node
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === updatedNode.id ? updatedNode : node))
    );

    handleCloseNodeDialog();
  };

  const handleSaveEdge = (updatedEdge) => {
    setEdges((eds) =>
      eds.map((edge) => (edge.id === updatedEdge.id ? updatedEdge : edge))
    );
    handleCloseEdgeDialog();
  };
  useEffect(() => {
    syncVariablesFromNodes(nodes);
  }, [nodes]);
  return (
    <div className="h-[100vh] w-[90vw] bg-slate-300 relative">
      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isSelected: selectedNode?.id === node.id,
          },
        }))}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        edges={normalizedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
      >
        <Background color="#000" gap="15" />
        <Controls />
      </ReactFlow>

      {selectedNode && (
        <BaseNodeDialog
          node={selectedNode}
          onClose={handleCloseNodeDialog}
          onDelete={handleDeleteNode}
          onSave={handleSaveNode}
        />
      )}

      {selectedEdge && (
        <EdgeDialog
          edge={selectedEdge}
          onDelete={handleDeleteEdge}
          onClose={handleCloseEdgeDialog}
          onSave={handleSaveEdge}
          nodes={nodes}
          edges={edges}
        />
      )}

      {showLabelPrompt && pendingConnection && (
        <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 min-w-[200px] text-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowLabelPrompt(false);
                setPendingConnection(null);
                setLabelChoice("");
              }}
            >
              <X size={16} />
            </button>

            <div className="font-medium mb-2 text-gray-700">
              Select edge label:
            </div>

            {availableLabels.length > 0 ? (
              <>
                <select
                  value={labelChoice}
                  onChange={(e) => setLabelChoice(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded mb-3 text-gray-800"
                >
                  {availableLabels.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <div className="flex justify-end space-x-2">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    onClick={handleLabelConfirm}
                  >
                    Confirm
                  </button>
                  <button
                    className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
                    onClick={() => {
                      setShowLabelPrompt(false);
                      setPendingConnection(null);
                      setLabelChoice("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p className="text-red-600 text-sm">
                All available options are already used for this node.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FlowCanvas;
