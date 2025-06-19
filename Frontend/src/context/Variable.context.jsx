// src/context/VariableContext.jsx
import { createContext, useContext, useState } from "react";

const VariableContext = createContext();

export const VariableProvider = ({ children }) => {
  const [variables, setVariables] = useState([]);

  const syncVariablesFromNodes = (nodes) => {
    const vars = nodes
      .filter((n) => n.type === "askaQuestion")
      .map((n) => n.data?.properties?.propertyName)
      .filter(Boolean);
    setVariables([...new Set(vars)]);
  };

  return (
    <VariableContext.Provider value={{ variables, syncVariablesFromNodes }}>
      {children}
    </VariableContext.Provider>
  );
};

export const useVariableContext = () => useContext(VariableContext);
