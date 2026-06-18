import React, { useRef, useState } from 'react';
import { Paperclip, Loader2 } from 'lucide-react';
import { uploadDocument } from '../api/document.api';

const FileAttachButton = ({ disabled, onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadDocument(file);
      if (onUploadSuccess) onUploadSuccess(result);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
      />
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => fileInputRef.current?.click()}
        className="p-3 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
        title="Attach Document"
      >
        {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
      </button>
    </>
  );
};

export default FileAttachButton;
