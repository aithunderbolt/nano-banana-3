import React, { useState } from 'react';
import { ENDPOINTS } from '../config';
import { downloadImage } from '../utils/download';

const Combine = () => {
  const [images, setImages] = useState([]);
  const [prompt, setPrompt] = useState('Blend the images naturally.');
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImages(prev => [...prev, event.target.result]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCombine = async () => {
    if (images.length < 2) {
      setError('Please upload at least two images.');
      return;
    }
    setLoading(true);
    setError(null);

    // Convert data URL to PNG blob via canvas to match server's expected mime type
    const dataUrlToPngBlob = async (dataUrl) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create PNG blob'));
          }, 'image/png');
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      });
    };

    try {
      const formData = new FormData();
      formData.append('prompt', prompt || '');
      
      // Convert all images to blobs and append to formData
      for (let i = 0; i < images.length; i++) {
        const blob = await dataUrlToPngBlob(images[i]);
        formData.append('images', blob, `image${i + 1}.png`);
      }

      const response = await fetch(ENDPOINTS.COMBINE_IMAGES, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        let msg = 'Failed to combine images';
        try {
          const errJson = await response.json();
          msg = errJson.message || msg;
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await response.json();
      setResultImage(data.imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feature">
      <h2>Combine Images</h2>
      <div className="control-group">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="file-input-label">
            <span>Add Image</span>
            <input className="file-input" type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
          <span style={{ color: '#666', fontSize: '14px' }}>
            {images.length} image{images.length !== 1 ? 's' : ''} uploaded
          </span>
        </div>
      </div>

      {images.length > 0 && (
        <div className="inpainting-container">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', width: '100%', flexWrap: 'wrap' }}>
            {images.map((image, index) => (
              <div key={index} style={{ flex: '1 1 200px', minWidth: 0, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ margin: 0 }}>Image {index + 1}:</p>
                  <button 
                    onClick={() => handleRemoveImage(index)}
                    style={{ 
                      background: '#ff4444', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      padding: '4px 8px', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div className="media-box">
                  <img src={image} alt={`Image ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              </div>
            ))}

            <div style={{width: '100%', maxWidth: '500px', marginTop: '16px'}}>
              <textarea
                className="input textarea"
                rows="3"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe how to combine the images (e.g., 'Blend all images naturally' or 'Place elements from different images together')"
              ></textarea>
              <button className="btn primary" onClick={handleCombine} disabled={loading || images.length < 2}>
                {loading ? 'Combining...' : 'Combine Images'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="error" style={{ color: 'red', marginTop: 10 }}>{error}</p>}

      {resultImage && (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ marginTop: 0 }}>Combined Image:</h3>
          <div className="media-box">
            <img src={resultImage} alt="Combined" />
          </div>
          <button className="btn primary" style={{ marginTop: '10px' }} onClick={() => downloadImage(resultImage)}>Download</button>
        </div>
      )}
    </div>
  );
};

export default Combine;
