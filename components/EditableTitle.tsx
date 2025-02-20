"use client";
import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface EditableTitleProps {
  title: string;
  onSave: (newTitle: string) => void;
}

export default function EditableTitle({ title, onSave }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const handleSave = () => {
    if (editedTitle.trim()) {
      onSave(editedTitle);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="bg-gray-800 text-white px-2 py-1 rounded outline-none"
          autoFocus
        />
        <button 
          onClick={handleSave}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Check size={16} />
        </button>
        <button 
          onClick={() => {
            setEditedTitle(title);
            setIsEditing(false);
          }}
          className="text-gray-400 hover:text-white transition-colors"
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