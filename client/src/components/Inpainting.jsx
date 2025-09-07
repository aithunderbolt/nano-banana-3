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
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
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
    const originalCanvas = document.createElement('canvas');
    originalCanvas.width = canvas.width;
    originalCanvas.height = canvas.height;
    const originalCtx = originalCanvas.getContext('2d');
    const img = new Image();
    img.src = image;
    originalCtx.drawImage(img, 0, 0);

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
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
    
    return new Promise(resolve => {
      maskCanvas.toBlob(blob => resolve(blob), 'image/png');
    });
  };

  const handleEdit = async () => {
    setLoading(true);
    setError(null);

    const maskBlob = await getMaskBlob();
    const imageFile = await (await fetch(image)).blob();

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('image', imageFile, 'image.png');
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
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                style={{width:'100%',borderRadius:10,boxShadow:'inset 0 1px 0 rgba(0,0,0,0.03)'}}
              />
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
        <div className="image-container">
          <h3 style={{marginTop:0}}>Edited Image:</h3>
          <img src={editedImage} alt="Edited" />
        </div>
      )}
    </div>
  );
};

export default Inpainting;
