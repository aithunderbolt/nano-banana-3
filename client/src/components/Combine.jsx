import React, { useState } from 'react';
import { ENDPOINTS } from '../config';
import { downloadImage } from '../utils/download';

const Combine = () => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [prompt, setPrompt] = useState('Blend the two images naturally.');
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = (e, which) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (which === 'image1') setImage1(event.target.result);
      if (which === 'image2') setImage2(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCombine = async () => {
    if (!image1 || !image2) {
      setError('Please upload two images first.');
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
      const blob1 = await dataUrlToPngBlob(image1);
      const blob2 = await dataUrlToPngBlob(image2);

      const formData = new FormData();
      formData.append('prompt', prompt || '');
      formData.append('image1', blob1, 'image1.png');
      formData.append('image2', blob2, 'image2.png');

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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label className="file-input-label">
            <span>Upload Image 1</span>
            <input className="file-input" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'image1')} />
          </label>
          <label className="file-input-label">
            <span>Upload Image 2</span>
            <input className="file-input" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'image2')} />
          </label>
        </div>
      </div>

      {(image1 || image2) && (
        <div className="inpainting-container">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', width: '100%', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <p>Image 1:</p>
              <div className="media-box">
                {image1 ? (
                  <img src={image1} alt="First" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ padding: 12, color: '#777' }}>No image</div>
                )}
              </div>
            </div>

            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <p>Image 2:</p>
              <div className="media-box">
                {image2 ? (
                  <img src={image2} alt="Second" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ padding: 12, color: '#777' }}>No image</div>
                )}
              </div>
            </div>

            <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea
                className="input textarea"
                rows="3"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe how to combine the images (e.g., 'Place the person from image 1 into the background of image 2')"
              ></textarea>
              <button className="btn primary" onClick={handleCombine} disabled={loading}>
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
