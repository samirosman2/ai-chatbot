"use client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ChatHistory {
  id: string;
  title: string;
  timestamp: string;
}

interface SidebarProps {
  chats: ChatHistory[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  currentChatId: string;
}

export default function Sidebar({ chats, onNewChat, onSelectChat, currentChatId }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-900 h-screen p-4 flex flex-col">
      <Button 
        onClick={onNewChat}
        className="w-full mb-4 bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2"
      >
        <PlusCircle size={16} />
        New Chat
      </Button>

      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`p-3 rounded-lg mb-2 cursor-pointer ${
              currentChatId === chat.id
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            {chat.title}
          </div>
        ))}
      </div>
    </div>
  );
}