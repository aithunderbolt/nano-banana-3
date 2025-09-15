import React from 'react';

const Sidebar = ({ onSelectFeature, activeFeature }) => {
  return (
    <div className="sidebar">
      <div className="brand">AI Photo Editor</div>
      <button
        className={`sidebar-button ${activeFeature === 'text-to-image' ? 'active' : ''}`}
        onClick={() => onSelectFeature('text-to-image')}
      >
        <span>Text-to-Image</span>
      </button>

      <button
        className={`sidebar-button ${activeFeature === 'text-to-image-n8n' ? 'active' : ''}`}
        onClick={() => onSelectFeature('text-to-image-n8n')}
      >
        <span>Text-to-Image (n8n)</span>
      </button>

      <button
        className={`sidebar-button ${activeFeature === 'inpainting' ? 'active' : ''}`}
        onClick={() => onSelectFeature('inpainting')}
      >
        <span>In-painting</span>
      </button>

      <button
        className={`sidebar-button ${activeFeature === 'outpainting' ? 'active' : ''}`}
        onClick={() => onSelectFeature('outpainting')}
      >
        <span>Out-painting</span>
      </button>

      <button
        className={`sidebar-button ${activeFeature === 'image-understanding' ? 'active' : ''}`}
        onClick={() => onSelectFeature('image-understanding')}
      >
        <span>Image Understanding</span>
      </button>
    </div>
  );
};

export default Sidebar;
