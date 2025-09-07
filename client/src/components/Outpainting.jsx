import React, { useState, useRef, useEffect } from 'react';
import { downloadImage } from '../utils/download';

const Outpainting = () => {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [expandedImage, setExpandedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExpand = async () => {
    if (!image) {
      setError('Please upload an image first.');
      return;
    }
    setLoading(true);
    setError(null);

    const img = new Image();
    img.src = image;
    img.onload = async () => {
      const originalWidth = img.width;
      const originalHeight = img.height;

      // For this feature, we'll expand the canvas by 50% on each side
      const newWidth = originalWidth * 2;
      const newHeight = originalHeight * 2;

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');

      // Fill background with white
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, newWidth, newHeight);

      // Draw the original image in the center
      const offsetX = (newWidth - originalWidth) / 2;
      const offsetY = (newHeight - originalHeight) / 2;
      ctx.drawImage(img, offsetX, offsetY);

      // Create the mask: a black image with a transparent hole for the original image
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = newWidth;
      maskCanvas.height = newHeight;
      const maskCtx = maskCanvas.getContext('2d');
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, newWidth, newHeight);
      maskCtx.clearRect(offsetX, offsetY, originalWidth, originalHeight);

      const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const maskBlob = await new Promise(resolve => maskCanvas.toBlob(resolve, 'image/png'));

      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('image', imageBlob, 'image.png');
      formData.append('mask', maskBlob, 'mask.png');

      try {
        const response = await fetch('http://localhost:5000/api/edit-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to expand image');
        }

        const data = await response.json();
        setExpandedImage(data.imageUrl);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
  };

  return (
    <div className="feature">
      <h2>Image Out-painting (Expand Image)</h2>
      <div className="control-group">
        <input className="file-input" type="file" onChange={handleImageUpload} accept="image/*" />
      </div>

      {image && (
        <div className="inpainting-container">
          <div style={{display:'flex',gap:16,alignItems:'flex-start',width:'100%'}}>
            <div style={{flex:'1 1 600px',minWidth:0}}>
                <p>Original Image:</p>
              <div className="media-box">
                <img src={image} alt="Original for outpainting" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
              </div>
            </div>

            <div style={{width:350,display:'flex',flexDirection:'column',gap:12}}>
              <textarea
                className="input textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what to add to the expanded areas"
                rows="3"
              />
              <button className="btn primary" onClick={handleExpand} disabled={loading}>
                {loading ? 'Expanding...' : 'Expand Image'}
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="error" style={{color: 'red', marginTop: '10px'}}>{error}</p>}
      {expandedImage && (
        <div style={{marginTop:18}}>
          <h3 style={{marginTop:0}}>Expanded Image:</h3>
          <div className="media-box">
            <img src={expandedImage} alt="Expanded" />
          </div>
          <button className="btn primary" style={{marginTop: '10px'}} onClick={() => downloadImage(expandedImage)}>Download</button>
        </div>
      )}
    </div>
  );
};

export default Outpainting;
