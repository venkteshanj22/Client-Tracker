import React, { useState } from 'react';
import { Download, Eye, X, FileText, Image, Video, Archive } from 'lucide-react';

const FileViewer = ({ attachments, onDownload, onDelete, canDelete = false }) => {
  const [previewFile, setPreviewFile] = useState(null);

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-5 h-5" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canPreview = (fileType) => {
    return fileType.startsWith('image/') || fileType === 'application/pdf';
  };

  const handlePreview = (attachment) => {
    if (canPreview(attachment.file_type)) {
      setPreviewFile(attachment);
    }
  };

  const getPreviewUrl = (attachment) => {
    return `${process.env.REACT_APP_BACKEND_URL}/api/download/${attachment.filename}`;
  };

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No files attached</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Attachments ({attachments.length})
      </h4>
      
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center space-x-3 flex-1">
            <div className="text-gray-500">
              {getFileIcon(attachment.file_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.original_filename}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(attachment.file_size)} • {attachment.file_type}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {canPreview(attachment.file_type) && (
              <button
                onClick={() => handlePreview(attachment)}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => onDownload(attachment)}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            
            {canDelete && (
              <button
                onClick={() => onDelete(attachment)}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                title="Delete"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">{previewFile.original_filename}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 max-h-96 overflow-auto">
              {previewFile.file_type.startsWith('image/') ? (
                <img
                  src={getPreviewUrl(previewFile)}
                  alt={previewFile.original_filename}
                  className="max-w-full h-auto"
                />
              ) : previewFile.file_type === 'application/pdf' ? (
                <iframe
                  src={getPreviewUrl(previewFile)}
                  className="w-full h-96"
                  title={previewFile.original_filename}
                />
              ) : null}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => onDownload(previewFile)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => setPreviewFile(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileViewer;