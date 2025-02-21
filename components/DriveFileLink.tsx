"use client";
import { useState } from 'react';
import { Link, Loader, FileText, X } from 'lucide-react';

interface DriveFile {
  id: string;
  url: string;
  name: string;
  isProcessed: boolean;
}

interface DriveLinkProps {
  onFilesUpdate: (files: DriveFile[]) => void;
}

export default function DriveFileLink({ onFilesUpdate }: DriveLinkProps) {
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractFileId = (url: string) => {
    const match = url.match(/[-\w]{25,}(?!.*[-\w]{25,})/);
    return match ? match[0] : null;
  };

  const addDriveLink = () => {
    try {
      const fileId = extractFileId(url);
      if (!fileId) {
        throw new Error('Invalid Google Drive link');
      }

      const newFile: DriveFile = {
        id: fileId,
        url,
        name: `Document ${files.length + 1}`,
        isProcessed: false
      };

      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      onFilesUpdate(updatedFiles);
      setUrl('');
      setError(null);
    } catch (err) {
      setError('Please enter a valid Google Drive link');
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
    onFilesUpdate(updatedFiles);
  };

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste Google Drive shared link"
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={addDriveLink}
          disabled={loading || !url}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? <Loader className="animate-spin" /> : <Link className="w-5 h-5" />}
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      {files.length > 0 && (
        <div className="mt-2 space-y-2">
          {files.map((file) => (
            <div 
              key={file.id}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
            >
              <FileText className="text-blue-500" size={20} />
              <span className="flex-1 text-sm truncate">{file.name}</span>
              <button
                onClick={() => removeFile(file.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}