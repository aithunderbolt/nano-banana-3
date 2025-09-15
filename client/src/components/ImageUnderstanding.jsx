import React, { useState } from 'react';
import { downloadImage } from '../utils/download';
import { ENDPOINTS } from '../config';

const ImageUnderstanding = () => {
  const [image, setImage] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleAskQuestion = async () => {
    if (!image) {
      setError('Please upload an image first.');
      return;
    }
    if (!question.trim()) {
      setError('Please enter a question about the image.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setAnswer('');

    try {
      // Convert the base64 image to a blob for sending
      const response = await fetch(image);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'image.png');
      formData.append('question', question);

      const apiResponse = await fetch(ENDPOINTS.UNDERSTAND_IMAGE, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.message || 'Failed to analyze image');
      }

      const data = await apiResponse.json();
      setAnswer(data.answer);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="feature">
      <h2>Image Understanding</h2>
      <div className="control-group">
        <label className="file-input-label">
          <span>Choose an image to analyze</span>
          <input type="file" onChange={handleImageUpload} accept="image/*" className="file-input" />
        </label>
      </div>

      {image && (
        <div className="inpainting-container">
          <div style={{display:'flex',gap:16,alignItems:'flex-start',width:'100%'}}>
            <div style={{flex:'1 1 600px',minWidth:0}}>
              <p>Image:</p>
              <div className="media-box">
                <img src={image} alt="Image for understanding" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
              </div>
            </div>

            <div style={{width:350,display:'flex',flexDirection:'column',gap:12}}>
              <textarea
                className="input textarea"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about this image"
                rows="3"
              />
              <button className="btn primary" onClick={handleAskQuestion} disabled={loading}>
                {loading ? 'Processing...' : 'Ask Question'}
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="error" style={{color: 'red', marginTop: '10px'}}>{error}</p>}
      {answer && (
        <div style={{marginTop:18}}>
          <h3 style={{marginTop:0}}>Answer:</h3>
          <div className="answer-box" style={{padding: '16px', background: '#f8f9fa', borderRadius: '10px', border: '1px solid #e9ecef'}}>
            <p style={{whiteSpace: 'pre-wrap', margin: 0}}>{answer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUnderstanding;