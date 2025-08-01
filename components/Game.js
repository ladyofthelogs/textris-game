import React, { useState, useEffect } from 'react';

const Game = () => {
  const [score, setScore] = useState(0);
  const [scoreNeeded, setScoreNeeded] = useState(100); // Example: 100 points needed for level 1
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute timer
  const [grid, setGrid] = useState(() =>
    Array(8).fill(null).map(() => Array(8).fill(null))
  ); // 8x8 grid, null for empty, ensuring unique inner arrays
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
    e.dataTransfer.setData('application/json', JSON.stringify({ shape, index }));
    e.dataTransfer.effectAllowed = 'move'; // Explicitly allow 'move' effect
    setDraggedShape(shape);
    setDraggedShapeIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!draggedShape) {
      console.log('No draggedShape in state, returning.');
      return;
    }
    const currentDraggedShape = draggedShape;

    const gameGrid = e.currentTarget;
    const gridRect = gameGrid.getBoundingClientRect();
    const cellSize = 40;

    const mouseX = e.clientX - gridRect.left;
    const mouseY = e.clientY - gridRect.top;

    const startCol = Math.floor(mouseX / cellSize);
    const startRow = Math.floor(mouseY / cellSize);

    console.log(`MouseX: ${mouseX}, MouseY: ${mouseY}, StartRow: ${startRow}, StartCol: ${startCol}`);

    const newGhostShape = [];
    let canPlace = true;

    for (let r = 0; r < currentDraggedShape.length; r++) {
      for (let c = 0; c < currentDraggedShape[r].length; c++) {
        if (currentDraggedShape[r][c] !== null) {
          const gridRow = startRow + r;
          const gridCol = startCol + c;

          if (
            gridRow >= grid.length ||
            gridCol >= grid[0].length ||
            (grid[gridRow] && grid[gridRow][gridCol] !== null)
          ) {
            canPlace = false;
            break;
          }
          newGhostShape.push({ row: gridRow, col: gridCol });
        }
      }
      if (!canPlace) break;
    }

    console.log('Can Place:', canPlace, 'New Ghost Shape:', newGhostShape);

    if (canPlace) {
      setGhostShape(newGhostShape);
    } else {
      setGhostShape(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    console.log('Drop event triggered.');
    if (!ghostShape) {
      console.log('No ghostShape, cannot drop.');
      return;
    }

    if (!draggedShape || draggedShapeIndex === null) {
      console.log('No draggedShape or draggedShapeIndex in state, cannot drop.');
      return;
    }
    const shape = draggedShape;
    const index = draggedShapeIndex;

    const newGrid = grid.map(row => [...row]);

    const startRow = ghostShape[0].row;
    const startCol = ghostShape[0].col;

    console.log(`Dropping shape at startRow: ${startRow}, startCol: ${startCol}`);

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== null) {
          const gridRow = startRow + r;
          const gridCol = startCol + c;
          newGrid[gridRow][gridCol] = shape[r][c];
          console.log(`Placed ${shape[r][c]} at [${gridRow}, ${gridCol}]`);
        }
      }
    }

    setGrid(newGrid);
    console.log('Grid updated.');

    setUpcomingShapes((prevShapes) => {
      const updatedShapes = prevShapes.filter((_, i) => i !== index);
      console.log('Upcoming shapes updated:', updatedShapes);
      return updatedShapes;
    });

    setDraggedShape(null);
    setDraggedShapeIndex(null);
    setGhostShape(null);
    console.log('Drag state reset.');
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
        onDragLeave={() => setGhostShape(null)}
      >
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const isGhost = ghostShape && ghostShape.some(
              (g) => g.row === rowIndex && g.col === colIndex
            );
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`grid-cell ${isGhost ? 'ghost-cell' : ''}`}
              >
                {cell}
              </div>
            );
          })
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