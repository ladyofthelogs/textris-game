import React, { useState, useEffect } from 'react';

const NyanCat = ({ trigger }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger > 0) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000); // Nyan Cat flies for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div key={trigger} className={`nyan-cat-container ${isVisible ? 'fly-in' : ''}`}>
      <img src="/cat.png" alt="Nyan Cat" className="nyan-cat-image" />
    </div>
  );
};

export default NyanCat;