import React, { useState, useEffect } from 'react';

const Game = () => {
  const [score, setScore] = useState(0);
  const [scoreNeeded, setScoreNeeded] = useState(100); // Example: 100 points needed for level 1
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute timer
  const [grid, setGrid] = useState(Array(8).fill(Array(8).fill(null))); // 8x8 grid, null for empty
  const [upcomingShapes, setUpcomingShapes] = useState([
    [['A', 'B'], ['C', 'D']], // Example shape 1 (2x2 block)
    [['E'], ['F'], ['G']],    // Example shape 2 (I shape)
    [['H'], ['I'], ['J']],        // Example shape 3 (1x3 block)
  ]);
  const [draggedShape, setDraggedShape] = useState(null);
  const [draggedShapeIndex, setDraggedShapeIndex] = useState(null);
  const [ghostShape, setGhostShape] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      console.log('Global click detected!', e.target);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleDragStart = (e, shape, index) => {
    console.log('Drag Start - Shape:', shape, 'Index:', index);
    setDraggedShape(shape);
    setDraggedShapeIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    // Logic for ghosting will go here
  };

  const handleDrop = (e) => {
    e.preventDefault();
    // Logic for placing the shape will go here
    setDraggedShape(null);
    setDraggedShapeIndex(null);
    setGhostShape(null);
  };

  const handleDragEnd = () => {
    setDraggedShape(null);
    setDraggedShapeIndex(null);
    setGhostShape(null);
  };

  const renderShape = (shape) => {
    return (
      <div
        className="shape-grid"
        style={{
          gridTemplateColumns: `repeat(${shape[0].length}, 20px)`,
          gridTemplateRows: `repeat(${shape.length}, 20px)`,
        }}
      >
        {shape.map((row, rowIndex) => (
          <div key={rowIndex} className="shape-row">
            {row.map((cell, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`} className="shape-cell">
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="game-container">
      <h1>Textris Game</h1>
      <div className="game-info">
        <div className="score-display">
          <p>Score Needed: {scoreNeeded}</p>
          <p>Player's Score: {score}</p>
        </div>
        <div className="timer-display">
          <p>Time: {formatTime(timeLeft)}</p>
        </div>
      </div>

      <div
        className="game-grid"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragEnd}
      >
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`grid-cell ${
                ghostShape && ghostShape.some(
                  (g) => g.row === rowIndex && g.col === colIndex
                )
                  ? 'ghost-cell'
                  : ''
              }`}
            >
              {cell}
            </div>
          ))
        ))}
      </div>

      <div className="upcoming-shapes">
        <h2>Upcoming Shapes</h2>
        <div className="shape-preview-container">
          {upcomingShapes.map((shape, index) => (
            <div
              key={index}
              className="shape-preview"
              draggable
              onDragStart={(e) => handleDragStart(e, shape, index)}
              onClick={() => console.log('Shape preview clicked!', shape)}
              style={{ cursor: 'pointer' }}
            >
              {renderShape(shape)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Game;