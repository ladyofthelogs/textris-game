import React, { useState, useEffect } from 'react';

const RealisticCatFlyer = ({ trigger }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [catImage, setCatImage] = useState('');
  const [direction, setDirection] = useState('left-to-right'); // New state for direction

  const catImages = [
    '/cat_realistic_1.png',
    '/cat_realistic_2.png',
    '/cat_realistic_3.png',
    '/cat_realistic_4.png',
    '/cat_realistic_5.png',
  ];

  useEffect(() => {
    if (trigger > 0) {
      const randomIndex = Math.floor(Math.random() * catImages.length);
      setCatImage(catImages[randomIndex]);
      setDirection(Math.random() < 0.5 ? 'left-to-right' : 'right-to-left'); // Randomize direction
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000); // Cat flies for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div key={trigger} className={`nyan-cat-container ${isVisible ? direction : ''}`}>
      {catImage && <img src={catImage} alt="Realistic Cat" className="nyan-cat-image" />}
    </div>
  );
};

export default RealisticCatFlyer;