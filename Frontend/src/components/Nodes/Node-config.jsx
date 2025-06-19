export const NODE_TYPES = {
  start: "User Message",
  message: "Send Text",
  askaQuestion: "Ask a Question",
  buttons: "Decision Buttons",
  apiCall: "API Call",
  keywordMatch: "Keyword Match",
  end: "End Flow",
};

export function getNodeLabel(type) {
  return NODE_TYPES[type] || type;
}

export const NODE_CATEGORY_MAP = {
  TriggerUserMessage: "start",

  ActionSendText: "message",
  ActionAskaQuestion: "askaQuestion",
  ActionButtons: "buttons",
  ActionApiCall: "apiCall",

  ConditionKeyword: "keywordMatch",

  ControlEndFlow: "end",
};

export function getNodeCategory(type) {
  return NODE_CATEGORY_MAP[type] || type;
}

export const nodeFieldMap = {
  start: {
    quickReply: "",
    waitForUserReply: false,
  },
  message: {
    message: "",
    waitForUserReply: false,
  },
  buttons: {
    message: "",
    buttons: [""],
    waitForUserReply: false,
  },
  keywordMatch: {
    keywords: [""],
    waitForUserReply: false,
  },
  apiCall: {
    requestName: "",
    method: "GET",
    url: "",
    authType: "none",
    headers: [],
    username: "",
    password: "",
    bearerToken: "",
    accessToken: "",
    waitForUserReply: false,
  },
  askaQuestion: {
    question: "",
    validationType: "none",
    numberOfRepeats: "1",
    saveTheAnswerAsContactProperty: "false",
    propertyName: "",
    waitForUserReply: false,
  },
  end: {
    waitForUserReply: false,
  },
};

export function getInitialFields(type) {
  const fields = nodeFieldMap[type];
  return fields ? structuredClone(fields) : {};
}

export const TriggerNodes = ["start"];

export const ConditionNodes = ["keywordMatch", "end"];

export const ActionNodes = ["message", "askaQuestion", "buttons", "apiCall"];
