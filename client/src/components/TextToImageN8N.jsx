import React, { useState } from 'react';
import { downloadImage } from '../utils/download';
import { ENDPOINTS } from '../config';

const TextToImageN8N = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractImageUrl = (data) => {
    // Try common keys that n8n workflows might return
    const candidate =
      data?.imageUrl ||
      data?.url ||
      data?.image_url ||
      data?.imageUrlSigned ||
      data?.output?.[0] ||
      data?.data?.url ||
      data?.image;

    const toUrl = (val) => {
      if (!val) return null;
      if (typeof val !== 'string') return null;
      if (val.startsWith('http') || val.startsWith('data:')) return val;
      // Assume base64 payload without prefix
      return `data:image/png;base64,${val}`;
    };

    if (Array.isArray(candidate)) {
      return toUrl(candidate[0]);
    }
    return toUrl(candidate);
  };

  const generateImage = async () => {
    setLoading(true);
    setError(null);
    setImageUrl('');
    try {
      const response = await fetch(ENDPOINTS.N8N_GENERATE_IMAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.message || data?.error || `Failed with status ${response.status}`;
        throw new Error(message);
      }

      const url = extractImageUrl(data);
      if (!url) {
        throw new Error('No output or the model was unable to process this request');
      }

      setImageUrl(url);
    } catch (err) {
      setError(err.message || 'Unexpected error generating image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feature">
      <h2>Text-to-Image Generation (n8n)</h2>
      <div className="prompt-container" style={{maxWidth: '600px', margin: '0 auto'}}>
        <div className="control-group" style={{flexDirection: 'column', alignItems: 'stretch'}}>
          <textarea
            className="input textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A scenic forest at sunrise, cinematic lighting"
            rows="3"
            style={{width: '100%'}}
          ></textarea>
          <button className={`btn primary`} onClick={generateImage} disabled={loading}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {imageUrl && (
        <div style={{ marginTop: 18 }}>
          <div className="media-box">
            <img src={imageUrl} alt="Generated" />
          </div>
          <button
            className="btn primary"
            style={{ marginTop: '10px' }}
            onClick={() => downloadImage(imageUrl)}
          >
            Download
          </button>
        </div>
      )}
    </div>
  );
};

export default TextToImageN8N;
