import React, { useState, useEffect } from 'react';

const RealisticCatFlyer = ({ trigger }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [catImage, setCatImage] = useState('');

  const catImages = [
    '/cat_realistic_1.png',
    '/cat_realistic_2.png',
    '/cat_realistic_3.png',
    '/cat_realistic_4.png',
    '/cat_realistic_5.png',
    '/cat_realistic_6.png',
    '/cat_realistic_7.png',
    '/cat_realistic_8.png',
  ];

  useEffect(() => {
    if (trigger > 0) {
      const randomIndex = Math.floor(Math.random() * catImages.length);
      setCatImage(catImages[randomIndex]);
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000); // Cat flies for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div key={trigger} className={`nyan-cat-container ${isVisible ? 'fly-in' : ''}`}>
      {catImage && <img src={catImage} alt="Realistic Cat" className="nyan-cat-image" />}
    </div>
  );
};

export default RealisticCatFlyer;