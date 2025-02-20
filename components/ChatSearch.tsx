"use client";
import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface ChatSearchProps {
  onSearch: (term: string) => void;
}

export default function ChatSearch({ onSearch }: ChatSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onSearch(term);
  };

  return (
    <div className="relative mb-4">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search chats..."
          className="w-full bg-gray-800 text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        {searchTerm && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}