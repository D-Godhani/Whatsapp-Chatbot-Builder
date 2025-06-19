import { useState, useRef, useCallback, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import FlowCanvas from "./Flowcanvas";
import { useParams } from "react-router-dom";
import FlowBuilderLeftSidebar from "./Flowbuilderleftsidebar";
import FlowBuilderRightSidebar from "./Flowbuilderrightsidebar";
import { validateFlow } from "./utils/FlowValidation";

import {
  updateProjectFlow,
  getProjectById,
} from "../../services/projectService";

import {
  getNodeLabel,
  getNodeCategory,
  getInitialFields,
} from "../Nodes/node-config";
import { VariableProvider } from "../../context/Variable.context";

function FlowBuilder() {
  const { id: projectId } = useParams();
  const [flowErrors, setFlowErrors] = useState([]);
  const reactFlowWrapper = useRef(null);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const onReset = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setFlowErrors([]);
    saveFlow();
  }, [setNodes, setEdges]);

  const onAddNode = useCallback(
    (type) => {
      if (!reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();

      // Default center position
      let position = {
        x: bounds.width / 2,
        y: bounds.height / 2,
      };

      // Avoid overlap: check if any existing node is within 50px radius
      const OVERLAP_RADIUS = 50;

      const isOverlapping = nodes.some(
        (node) =>
          Math.abs(node.position.x - position.x) < OVERLAP_RADIUS &&
          Math.abs(node.position.y - position.y) < OVERLAP_RADIUS
      );

      if (isOverlapping) {
        // Apply slight random offset
        const offsetX = Math.random() * 100 - 50; // -50 to +50
        const offsetY = Math.random() * 100 - 50;
        position.x += offsetX;
        position.y += offsetY;
      }

      const id = `${type}-${+new Date()}`;
      const newNode = {
        id, // unique identifier (string)
        type: getNodeCategory(type),
        // subtype: type, // this stays "default" for React Flow node type
        position, // { x, y }
        data: {
          label: getNodeLabel(type),
          content: `${type}`,
          properties: {
            // "trigger" | "action" | "condition"
            fields: getInitialFields(type), // Optional: used for form fields in dialog
            isSelected: false, // optional UI state
          },
        },
      };
      // console.log(getNodeCategory(type));
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, nodes]
  );

  useEffect(() => {
    const fetchProjectFlow = async () => {
      try {
        const projectFlow = await getProjectById(projectId);
        if (projectFlow && projectFlow.fileTree) {
          setNodes(projectFlow.fileTree.nodes || []);
          setEdges(projectFlow.fileTree.edges || []);
        }
      } catch (error) {
        console.error("Failed to fetch flow:", error);
        toast.error("Failed to load flow.");
      }
    };
    fetchProjectFlow();
  }, [projectId]);

  const saveFlow = async () => {
    const { isValid, errors } = validateFlow(nodes, edges);
    const fileTree = { nodes, edges };

    if (isValid) {
      try {
        const data = await updateProjectFlow(projectId, fileTree);
        console.log("Flow updated:", data);
        toast.success("Flow saved successfully!");
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Failed to save flow");
      }
    } else {
      setFlowErrors(errors);
      errors.forEach((err) => toast.error(err)); // Show each error clearly
      // Optional: setFlowErrors(errors); // only if you're displaying them somewhere
    }
  };

  return (
    <div className="relative h-screen w-full bg-gray-100 overflow-hidden">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        pauseOnHover={true}
      />

      <FlowBuilderLeftSidebar onAddNode={onAddNode} />

      <div
        ref={reactFlowWrapper}
        style={{
          position: "absolute",
          top: 0,
          left: "80px",
          right: "80px",
          bottom: 0,
        }}
      >
        <VariableProvider>
          <FlowCanvas
            nodes={nodes}
            setNodes={setNodes}
            edges={edges}
            setEdges={setEdges}
          />
        </VariableProvider>
      </div>

      <FlowBuilderRightSidebar onReset={onReset} onSave={saveFlow} />
    </div>
  );
}

export default FlowBuilder;
