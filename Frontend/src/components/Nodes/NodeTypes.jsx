import {
  ActionButtons,
  ActionApiCall,
  ActionDelay,
  ActionQuickReply,
  ActionSendMedia,
  ActionSendText,
  ActionAskaQuestion,
  AiGpt,
  ConditionKeyword,
  ConditionVariable,
  ControlEndFlow,
  ControlGoto,
  DebugLog,
  TriggerNewChat,
  TriggerUserMessage,
} from "./NodeWrapper";

const nodeTypes = {
  start: TriggerUserMessage,
  // TriggerNewChat: TriggerNewChat,
  keywordMatch: ConditionKeyword,
  // ConditionVariable: ConditionVariable,
  message: ActionSendText,
  buttons: ActionButtons,
  askaQuestion: ActionAskaQuestion,
  // ActionSendMedia: ActionSendMedia,
  // ActionQuickReply: ActionQuickReply,
  // ActionDelay: ActionDelay,
  // ActionSetVariable: ActionSetVariable,
  apiCall: ActionApiCall,
  // ControlGoto: ControlGoto,
  end: ControlEndFlow,
  // ConditionInputAsk: InputAsk,
  // ConditionAiGpt: AiGpt,
  // ConditionDebugLog: DebugLog,
};

export default nodeTypes;
