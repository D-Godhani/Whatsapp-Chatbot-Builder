// Batch-created WhatsApp Chatbot Builder Nodes using TailwindCSS

import { Handle, Position } from "@xyflow/react";

// BaseNodeWrapper (reusable shell for all nodes)
function BaseNode({
  icon,
  label,
  bgColor = "bg-sky-200",
  data,
  hideRightHandle,
  hideLeftHandle,
}) {
  const selectedRing = data?.isSelected ? "ring-4 ring-black" : "";

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex items-center justify-center ${bgColor} border-2 border-black rounded-full w-[60px] h-[60px] shadow-md transition-all duration-200 ${selectedRing}`}
      >
        {!hideLeftHandle && (
          <Handle
            type="target"
            position={Position.Left}
            className="!w-2 !h-2 !bg-black absolute"
          />
        )}
        {!hideRightHandle && (
          <Handle
            type="source"
            position={Position.Right}
            className="!w-2 !h-2 !bg-black absolute"
          />
        )}
        {icon}
      </div>
      <div className="mt-1 px-3 py-1 text-sm text-center text-slate-800 rounded-2xl bg-white">
        {label}
      </div>
    </div>
  );
}

// Sample Icons (use lucide-react or other libs)
import {
  MessageSquare,
  Clock,
  Database,
  Bot,
  PhoneOutgoing,
  Smile,
  Settings,
  ChevronRightCircle,
  Code2,
  LogOut,
  BookOpenText,
  Loader2,
  Image,
  MessageCirclePlus,
  Logs,
  SquarePen,
  WholeWord,
  MessageSquareReply,
  Zap,
  UserRoundPen,
  SquareMenuIcon,
  LogIn,
} from "lucide-react";

export const TriggerUserMessage = (props) => (
  <BaseNode
    icon={<LogIn size={24} />}
    label="User Message"
    bgColor="bg-green-200"
    hideLeftHandle={true}
    {...props}
  />
);

export const TriggerNewChat = (props) => (
  <BaseNode
    icon={<MessageCirclePlus size={24} />}
    label="New Chat"
    bgColor="bg-green-300"
    {...props}
  />
);

export const ConditionKeyword = (props) => (
  <BaseNode
    icon={<WholeWord size={24} />}
    label="Keyword Match"
    bgColor="bg-yellow-200"
    {...props}
  />
);

export const ConditionVariable = (props) => (
  <BaseNode
    icon={<Settings size={24} />}
    label="Variable Check"
    bgColor="bg-yellow-300"
    {...props}
  />
);

export const ActionSendText = (props) => (
  <BaseNode
    icon={<MessageSquare size={24} />}
    label="Send Text"
    bgColor="bg-blue-200"
    {...props}
  />
);

export const ActionSendMedia = (props) => (
  <BaseNode
    icon={<Image size={24} />}
    label="Send Media"
    bgColor="bg-blue-300"
    {...props}
  />
);

export const ActionQuickReply = (props) => (
  <BaseNode
    icon={<MessageSquareReply size={24} />}
    label="Quick Reply"
    bgColor="bg-blue-100"
    {...props}
  />
);

export const ActionDelay = (props) => (
  <BaseNode
    icon={<Clock size={24} />}
    label="Delay"
    bgColor="bg-purple-200"
    {...props}
  />
);

export const ActionSetVariable = (props) => (
  <BaseNode
    icon={<Database size={24} />}
    label="Set Variable"
    bgColor="bg-purple-300"
    {...props}
  />
);

export const ActionApiCall = (props) => (
  <BaseNode
    icon={<Code2 size={24} />}
    label="API Call"
    bgColor="bg-indigo-300"
    {...props}
  />
);

export const ControlGoto = (props) => (
  <BaseNode
    icon={<ChevronRightCircle size={24} />}
    label="Go To Node"
    bgColor="bg-pink-200"
    {...props}
  />
);

export const ControlEndFlow = (props) => (
  <BaseNode
    icon={<LogOut size={24} />}
    label="End Flow"
    bgColor="bg-pink-300"
    hideRightHandle={true}
    {...props}
  />
);

export const ActionAskaQuestion = (props) => (
  <BaseNode
    icon={<SquarePen size={24} />}
    label="Ask a Question"
    bgColor="bg-orange-200"
    {...props}
  />
);

export const AiGpt = (props) => (
  <BaseNode
    icon={<Bot size={24} />}
    label="GPT Reply"
    bgColor="bg-gray-200"
    {...props}
  />
);

export const DebugLog = (props) => (
  <BaseNode
    icon={<Logs size={24} />}
    label="Log"
    bgColor="bg-gray-300"
    {...props}
  />
);
export const ActionButtons = (props) => (
  <BaseNode
    icon={<SquareMenuIcon size={24} />}
    label="Button Menu"
    bgColor="bg-gray-300"
    {...props}
  />
);

// Export all node components from here
export default {
  TriggerUserMessage,
  TriggerNewChat,
  ConditionKeyword,
  ConditionVariable,
  ActionSendText,
  ActionButtons,
  ActionSendMedia,
  ActionQuickReply,
  ActionDelay,
  ActionSetVariable,
  ActionApiCall,
  ControlGoto,
  ControlEndFlow,
  ActionAskaQuestion,
  //   AiGpt,
  //   DebugLog,
};
