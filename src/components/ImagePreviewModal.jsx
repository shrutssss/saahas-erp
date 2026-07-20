import React, { useRef, useState, useEffect } from 'react';

export default function ImagePreviewModal({
  imageUrl,
  onClose,
  onEdit,
  onDelete,
  title = '',
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file && onEdit) {
      setLoading(true);
      try {
        await onEdit(file);
        onClose();
      } catch (err) {
        console.error('Edit failed', err);
      } finally {
        setLoading(false);
      }
    }
    e.target.value = '';
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          color: '#FFF',
          zIndex: 10000,
        }}
      >
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{title}</span>
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFF',
            fontSize: '32px',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '4px',
            lineHeight: 1,
            opacity: loading ? 0.5 : 1,
          }}
        >
          &times;
        </button>
      </div>

      {/* Main Image */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img
          src={imageUrl}
          alt={title || 'Preview'}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '90vw',
            maxHeight: '80vh',
            objectFit: 'contain',
            opacity: loading ? 0.5 : 1,
          }}
        />
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#FFF',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            Processing...
          </div>
        )}
      </div>

      {/* Bottom Bar Controls */}
      {!loading && !showConfirm && (onEdit || onDelete) && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '24px',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '0 20px',
          }}
        >
          {onEdit && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => uploadInputRef.current?.click()}
                style={{
                  backgroundColor: '#F5C800',
                  color: '#1A1A1A',
                  padding: '10px 20px',
                  borderRadius: '50px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Choose File
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  backgroundColor: '#F5C800',
                  color: '#1A1A1A',
                  padding: '10px 20px',
                  borderRadius: '50px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Take Photo
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          )}

          {onDelete && (
            <button
              onClick={() => setShowConfirm(true)}
              style={{
                backgroundColor: '#EF4444',
                color: '#FFF',
                padding: '10px 20px',
                borderRadius: '50px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      {!loading && showConfirm && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '24px',
            backgroundColor: '#FFF',
            padding: '16px 24px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <p style={{ margin: '0 0 16px', fontWeight: '600', color: '#1A1A1A' }}>
            Are you sure you want to delete this photo?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowConfirm(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '50px',
                border: 'none',
                backgroundColor: '#E0E0E0',
                color: '#1A1A1A',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              style={{
                padding: '8px 16px',
                borderRadius: '50px',
                border: 'none',
                backgroundColor: '#EF4444',
                color: '#FFF',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Yes, Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
