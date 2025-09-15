import React, { useState } from 'react';
import { downloadImage } from '../utils/download';
import { ENDPOINTS } from '../config';

const TextToImage = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(ENDPOINTS.GENERATE_IMAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });

      // Try to parse JSON only if response advertises JSON
      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          // fall through to text handling below
        }
      }

      if (!response.ok) {
        // If not OK, try to extract error details
        if (!data) {
          const text = await response.text().catch(() => '');
          throw new Error(text || `Request failed (${response.status})`);
        }
        throw new Error(data.message || `Request failed (${response.status})`);
      }

      if (!data) {
        // Successful but no JSON? Try reading as text or flag a generic error
        const text = await response.text().catch(() => '');
        if (!text) throw new Error('Empty response from server');
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Unexpected non-JSON response from server');
        }
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
          <textarea
            className="input textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A scenic forest at sunrise, cinematic lighting"
            rows="3"
            style={{width: '400px'}}
          ></textarea>
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
