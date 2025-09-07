import React from 'react';

const Sidebar = ({ onSelectFeature }) => {
  return (
    <div className="sidebar">
      <button onClick={() => onSelectFeature('text-to-image')}>
        Text-to-Image
      </button>
      <button onClick={() => onSelectFeature('inpainting')}>
        In-painting
      </button>
    </div>
  );
};

export default Sidebar;
