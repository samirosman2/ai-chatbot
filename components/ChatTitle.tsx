"use client";
import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface ChatTitleProps {
  title: string;
  onUpdate: (newTitle: string) => void;
}

export default function ChatTitle({ title, onUpdate }: ChatTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const handleSave = () => {
    onUpdate(editedTitle);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          className="bg-gray-800 text-white px-2 py-1 rounded"
          autoFocus
        />
        <button onClick={handleSave} className="text-gray-400 hover:text-white">
          <Check size={16} />
        </button>
        <button 
          onClick={() => {
            setEditedTitle(title);
            setIsEditing(false);
          }} 
          className="text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="truncate">{title}</span>
      <button 
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"
      >
        <Edit2 size={16} />
      </button>
    </div>
  );
}