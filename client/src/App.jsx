import React, { useState } from 'react';
import './App.css';
import Inpainting from './components/Inpainting';

function App() {
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

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Photo Editor</h1>
      </header>
      <main>
        <div className="feature">
          <h2>Text-to-Image Generation</h2>
          <div className="prompt-container">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt to generate an image"
            />
            <button onClick={generateImage} disabled={loading}>
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          {imageUrl && (
            <div className="image-container">
              <img src={imageUrl} alt="Generated" />
            </div>
          )}
        </div>
        <hr />
        <Inpainting />
      </main>
    </div>
  );
}

export default App;
