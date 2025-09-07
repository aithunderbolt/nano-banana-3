import React, { useState, useRef, useEffect } from 'react';

const Inpainting = () => {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [editedImage, setEditedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

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

  useEffect(() => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        // Find the media-box container dimensions (display size)
        const mediaBox = canvas.closest('.media-box');
        const mediaRect = mediaBox ? mediaBox.getBoundingClientRect() : { width: 800, height: 600 };
        const displayWidth = Math.max(200, Math.floor(mediaRect.width));
        const displayHeight = Math.max(200, Math.floor(mediaRect.height));

        const dpr = window.devicePixelRatio || 1;
        // Set canvas internal resolution to match display size * devicePixelRatio
        canvas.width = Math.round(displayWidth * dpr);
        canvas.height = Math.round(displayHeight * dpr);
        // Draw the image scaled to the canvas internal size while preserving aspect ratio
        const imgW = img.width;
        const imgH = img.height;
        const canvasW = canvas.width;
        const canvasH = canvas.height;
        const imgAspect = imgW / imgH;
        const canvasAspect = canvasW / canvasH;
        let drawW, drawH;
        if (imgAspect > canvasAspect) {
          // image is wider relative to canvas -> fit by width
          drawW = canvasW;
          drawH = Math.round(canvasW / imgAspect);
        } else {
          // image is taller relative to canvas -> fit by height
          drawH = canvasH;
          drawW = Math.round(canvasH * imgAspect);
        }
        const dx = Math.round((canvasW - drawW) / 2);
        const dy = Math.round((canvasH - drawH) / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasW, canvasH);
        ctx.drawImage(img, 0, 0, imgW, imgH, dx, dy, drawW, drawH);

        // Keep CSS size 100% so it fits the media-box visually
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      };
      img.src = image;
    }
  }, [image]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 20;
    ctx.stroke();
  };

  const getMaskBlob = () => {
    const canvas = canvasRef.current;
    // Create canvases at the same internal resolution as the working canvas
    const originalCanvas = document.createElement('canvas');
    originalCanvas.width = canvas.width;
    originalCanvas.height = canvas.height;
    const originalCtx = originalCanvas.getContext('2d');

    const img = new Image();
    img.src = image;

    return new Promise(resolve => {
      img.onload = () => {
        // Draw original image scaled to the canvas internal resolution while preserving aspect ratio
        const imgW = img.width;
        const imgH = img.height;
        const canvasW = originalCanvas.width;
        const canvasH = originalCanvas.height;
        const imgAspect = imgW / imgH;
        const canvasAspect = canvasW / canvasH;
        let drawW, drawH;
        if (imgAspect > canvasAspect) {
          drawW = canvasW;
          drawH = Math.round(canvasW / imgAspect);
        } else {
          drawH = canvasH;
          drawW = Math.round(canvasH * imgAspect);
        }
        const dx = Math.round((canvasW - drawW) / 2);
        const dy = Math.round((canvasH - drawH) / 2);
        originalCtx.fillStyle = '#ffffff00';
        originalCtx.fillRect(0, 0, canvasW, canvasH);
        originalCtx.drawImage(img, 0, 0, imgW, imgH, dx, dy, drawW, drawH);

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        // Copy the current canvas (which includes the user's drawing) into mask canvas
        maskCtx.drawImage(canvas, 0, 0);

        const originalData = originalCtx.getImageData(0, 0, canvas.width, canvas.height);
        const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < originalData.data.length; i += 4) {
          if (originalData.data[i] !== maskData.data[i] || 
              originalData.data[i+1] !== maskData.data[i+1] || 
              originalData.data[i+2] !== maskData.data[i+2]) {
            maskData.data[i] = 255;
            maskData.data[i+1] = 255;
            maskData.data[i+2] = 255;
            maskData.data[i+3] = 255;
          } else {
            maskData.data[i] = 0;
            maskData.data[i+1] = 0;
            maskData.data[i+2] = 0;
            maskData.data[i+3] = 255;
          }
        }
        maskCtx.putImageData(maskData, 0, 0);

        maskCanvas.toBlob(blob => resolve(blob), 'image/png');
      };
    });
  };

  const handleEdit = async () => {
    setLoading(true);
    setError(null);

  const maskBlob = await getMaskBlob();
  // Use the current canvas content (which is already scaled to display resolution) as the image
  const canvas = canvasRef.current;
  const imageBlob = await new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));

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
        throw new Error('Failed to edit image');
      }

      const data = await response.json();
      setEditedImage(data.imageUrl);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="feature">
      <h2>Image In-painting</h2>
      <div className="control-group">
        <input className="file-input" type="file" onChange={handleImageUpload} accept="image/*" />
      </div>

      {image && (
        <div className="inpainting-container">
          <div style={{display:'flex',gap:16,alignItems:'flex-start',width:'100%'}}>
            <div style={{flex:'1 1 600px',minWidth:0}}>
              <div className="media-box">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseUp={finishDrawing}
                  onMouseMove={draw}
                  style={{borderRadius:10,boxShadow:'inset 0 1px 0 rgba(0,0,0,0.03)'}}
                />
              </div>
            </div>

            <div style={{width:260,display:'flex',flexDirection:'column',gap:12}}>
              <input
                className="input"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the edit (e.g., 'remove the person')"
              />
              <button className="btn primary" onClick={handleEdit} disabled={loading}>
                {loading ? 'Editing...' : 'Edit Image'}
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {editedImage && (
        <div style={{marginTop:18}}>
          <h3 style={{marginTop:0}}>Edited Image:</h3>
          <div className="media-box">
            <img src={editedImage} alt="Edited" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Inpainting;
