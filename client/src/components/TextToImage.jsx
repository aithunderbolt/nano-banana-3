import React, { useState } from 'react';
import { downloadImage } from '../utils/download';

const TextToImage = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate image');
      }

      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="feature">
      <h2>Text-to-Image Generation</h2>
      <div className="prompt-container">
        <div className="control-group">
          <input
            className="input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A scenic forest at sunrise, cinematic lighting"
          />
          <button className={`btn primary`} onClick={generateImage} disabled={loading}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {imageUrl && (
        <div style={{marginTop:18}}>
          <div className="media-box">
            <img src={imageUrl} alt="Generated" />
          </div>
          <button className="btn primary" style={{marginTop: '10px'}} onClick={() => downloadImage(imageUrl)}>Download</button>
        </div>
      )}
    </div>
  );
};

export default TextToImage;
