import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, UploadCloud, File as FileIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import '../../styles/uploadmodal.css';

const FileUploadModal = ({ isOpen, onClose, mode, onSend, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [isCompressed, setIsCompressed] = useState(false);
  const [error, setError] = useState('');
  const [isCompressingLocally, setIsCompressingLocally] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const fileInputRef = useRef(null);

  const isImage = mode === 'ai-image';
  const maxSize = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setOriginalSize(0);
      setIsCompressed(false);
      setError('');
      setPreviewUrl(null);
      setIsCompressingLocally(false);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (isProcessing) return;
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          const maxDim = 800; // max width 800px requested
          
          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.85);
        };
      };
    });
  };

  const processFile = async (rawFile) => {
    setError('');
    setOriginalSize(rawFile.size);
    setIsCompressed(false);
    setPreviewUrl(null);
    setFile(null);
    
    if (isImage && !rawFile.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    if (!isImage && rawFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    if (!isImage && rawFile.size > maxSize) {
      setError('PDF file exceeds the 5MB maximum limit.');
      return;
    }

    if (isImage) {
      if (rawFile.size > 1024 * 1024) { // > 1MB compression requested
        setIsCompressingLocally(true);
        const compressedFile = await compressImage(rawFile);
        setIsCompressingLocally(false);
        
        if (compressedFile.size > maxSize) {
          setError('Processed image is still over 5MB. Please upload a smaller image.');
          return;
        }
        setIsCompressed(true);
        setFile(compressedFile);
        setPreviewUrl(URL.createObjectURL(compressedFile));
      } else {
        if (rawFile.size > maxSize) {
          setError('Image exceeds the 5MB maximum limit.');
          return;
        }
        setFile(rawFile);
        setPreviewUrl(URL.createObjectURL(rawFile));
      }
    } else {
      setFile(rawFile);
    }
  };

  const handleUpload = () => {
    if (!file || isProcessing) return;
    onSend(file);
  };

  return ReactDOM.createPortal(
    <div 
      className="upload-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        className="upload-modal-content"
        style={{
          width: '480px',
          maxWidth: '90vw',
          borderRadius: '24px',
          position: 'relative',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          zIndex: 100000
        }}
      >
        
        <div className="upload-modal-header">
          <div className="upload-modal-heading">
            <div className="upload-modal-title">
              {isImage ? ' AI Image Detection' : ' AI PDF Detection'}
            </div>
            <div className="upload-modal-subtitle">
              {isImage ? 'Check if image is AI generated' : 'Check if document is AI generated'}
            </div>
          </div>
          <button type="button" className="upload-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {error && (
          <div className="upload-modal-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!file ? (
          <div 
            className={`upload-modal-dropzone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={isImage ? 'image/jpeg, image/png, image/webp' : 'application/pdf'}
              style={{ display: 'none' }}
              onChange={handleChange}
            />
            <div className="upload-modal-icon-wrapper">
              <UploadCloud size={52} strokeWidth={1.5} color="#8b5cf6" className="upload-modal-icon" />
            </div>
            <div className="upload-modal-text-primary">Drop {isImage ? 'image' : 'PDF'} here or click to browse</div>
            <div className="upload-modal-text-secondary">
              {isImage ? 'JPG, PNG, WEBP • Max 5MB' : 'PDF only • Max 5MB'}
            </div>
          </div>
        ) : (
          <div className="upload-modal-selected">
            {isImage && previewUrl ? (
              <div className="upload-modal-img-preview">
                <img src={previewUrl} alt="Preview" />
              </div>
            ) : (
              <div className="upload-modal-pdf-preview">
                <FileIcon size={56} strokeWidth={1.5} color="#8b5cf6" />
                <div className="pdf-preview-name">{file.name}</div>
              </div>
            )}
            
            <div className="upload-modal-file-status">
              {isImage && previewUrl && <div className="file-status-name">{file.name}</div>}
              <div className="file-status-metrics">
                <div className={`file-status-size ${(file.size <= maxSize) ? 'valid' : 'invalid'}`}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                {isCompressed && <div className="file-status-badge"><CheckCircle2 size={12} /> Optimized</div>}
                {file.size <= maxSize && !isCompressed && <div className="file-status-badge valid"><CheckCircle2 size={12} /> Ready to analyse</div>}
              </div>
            </div>
            <button type="button" className="upload-modal-remove-link" onClick={() => setFile(null)}>Choose different file</button>
          </div>
        )}

        <div className="upload-modal-footer">
          <button type="button" className="upload-modal-cancel" onClick={onClose}>Cancel</button>
              <button 
                type="button"
                className="upload-modal-submit" 
                onClick={handleUpload} 
                disabled={!file || isCompressingLocally || isProcessing || file.size > maxSize}
              >
                {isCompressingLocally ? 'Compressing...' : `Analyse ${isImage ? 'Image' : 'PDF'} →`}
              </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FileUploadModal;
