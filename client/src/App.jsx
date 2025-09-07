import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import TextToImage from './components/TextToImage';
import Inpainting from './components/Inpainting';

function App() {
  const [activeFeature, setActiveFeature] = useState('text-to-image');

  const renderFeature = () => {
    switch (activeFeature) {
      case 'text-to-image':
        return <TextToImage />;
      case 'inpainting':
        return <Inpainting />;
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
        <Sidebar onSelectFeature={setActiveFeature} />
        <main className="content">
          {renderFeature()}
        </main>
      </div>
    </div>
  );
}

export default App;

