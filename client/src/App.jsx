import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import TextToImage from './components/TextToImage';
import TextToImageN8N from './components/TextToImageN8N';
import Inpainting from './components/Inpainting';
import Outpainting from './components/Outpainting';
import ImageUnderstanding from './components/ImageUnderstanding';

function App() {
  const [activeFeature, setActiveFeature] = useState('text-to-image');

  const renderFeature = () => {
    switch (activeFeature) {
      case 'text-to-image':
        return <TextToImage />;
      case 'text-to-image-n8n':
        return <TextToImageN8N />;
      case 'inpainting':
        return <Inpainting />;
      case 'outpainting':
        return <Outpainting />;
      case 'image-understanding':
        return <ImageUnderstanding />;
      default:
        return <TextToImage />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Photo Editor</h1>
      </header>
      <div className="main-content">
        <Sidebar onSelectFeature={setActiveFeature} activeFeature={activeFeature} />
        <main className="content">
          <div className="container">
            {renderFeature()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

