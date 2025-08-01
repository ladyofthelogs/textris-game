import React, { useState, useEffect, useCallback } from 'react';

// Helper function to generate a random letter
const getRandomLetter = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return alphabet[Math.floor(Math.random() * alphabet.length)];
};

// Helper function to generate a random shape
const generateRandomShape = () => {
  const shapeTypes = [
    [[1]], // 1x1 block
    [[1, 1]], // 1x2 block
    [[1], [1]], // 2x1 block
    [[1, 1], [1, 1]], // 2x2 block
    [[1, 1, 1]], // 1x3 block
    [[1], [1], [1]], // 3x1 block
    [[1, 1, 0], [0, 1, 1]], // Z shape
    [[0, 1, 1], [1, 1, 0]], // S shape
    [[1, 1, 1], [0, 1, 0]], // T shape
  ];

  const randomShapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
  return randomShapeType.map(row =>
    row.map(cell => (cell === 1 ? getRandomLetter() : null))
  );
};

const Game = () => {
  const [score, setScore] = useState(0);
  const [scoreNeeded, setScoreNeeded] = useState(100); // Example: 100 points needed for level 1
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute timer
  const [grid, setGrid] = useState(() =>
    Array(8).fill(null).map(() => Array(8).fill(null))
  ); // 8x8 grid, null for empty, ensuring unique inner arrays
  const [upcomingShapes, setUpcomingShapes] = useState([]);
  const [draggedShape, setDraggedShape] = useState(null);
  const [draggedShapeIndex, setDraggedShapeIndex] = useState(null);
  const [ghostShape, setGhostShape] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStatus, setGameStatus] = useState(''); // 'win', 'lose', ''

  useEffect(() => {
    // Initialize upcoming shapes only once on component mount
    if (upcomingShapes.length === 0) {
      const initialShapes = [];
      for (let i = 0; i < 3; i++) {
        initialShapes.push(generateRandomShape());
      }
      setUpcomingShapes(initialShapes);
    }
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime > 0) {
          return prevTime - 1;
        } else {
          setGameOver(true);
          setGameStatus('lose');
          clearInterval(timer);
          return 0;
        }
      });
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

  const canPlaceShape = useCallback((shape, currentGrid) => {
    for (let r = 0; r <= currentGrid.length - shape.length; r++) {
      for (let c = 0; c <= currentGrid[0].length - (shape[0] ? shape[0].length : 0); c++) {
        let possible = true;
        for (let sr = 0; sr < shape.length; sr++) {
          for (let sc = 0; sc < shape[sr].length; sc++) {
            if (shape[sr][sc] !== null && currentGrid[r + sr][c + sc] !== null) {
              possible = false;
              break;
            }
          }
          if (!possible) break;
        }
        if (possible) return true;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    if (gameOver) return;

    // Only check for "no more moves" if upcomingShapes has been initialized
    if (upcomingShapes.length > 0) {
      const hasPossibleMoves = upcomingShapes.some(shape => canPlaceShape(shape, grid));

      if (upcomingShapes.length === 0 && !hasPossibleMoves) {
        setGameOver(true);
        setGameStatus('lose');
      }
    }
  }, [upcomingShapes, grid, gameOver, canPlaceShape]);

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
      // Add a new random shape if there are less than 3 upcoming shapes
      if (updatedShapes.length < 3) {
        updatedShapes.push(generateRandomShape());
      }
      console.log('Upcoming shapes updated:', updatedShapes);
      return updatedShapes;
    });

    setDraggedShape(null);
    setDraggedShapeIndex(null);
    setGhostShape(null);
    console.log('Drag state reset.');
    checkGridForMatches(newGrid);
  };

  const checkGridForMatches = useCallback((currentGrid) => {
    let newScore = score;
    let updatedGrid = currentGrid.map(row => [...row]);
    let linesCleared = 0;

    // Check rows
    for (let r = 0; r < updatedGrid.length; r++) {
      if (updatedGrid[r].every(cell => cell !== null)) {
        updatedGrid[r].fill(null); // Clear the row
        newScore += 10; // Award points for clearing a row
        linesCleared++;
      }
    }

    // Check columns
    for (let c = 0; c < updatedGrid[0].length; c++) {
      let isColumnFull = true;
      for (let r = 0; r < updatedGrid.length; r++) {
        if (updatedGrid[r][c] === null) {
          isColumnFull = false;
          break;
        }
      }
      if (isColumnFull) {
        for (let r = 0; r < updatedGrid.length; r++) {
          updatedGrid[r][c] = null; // Clear the column
        }
        newScore += 10; // Award points for clearing a column
        linesCleared++;
      }
    }

    if (linesCleared > 0) {
      setGrid(updatedGrid);
      setScore(newScore);
      console.log(`Cleared ${linesCleared} lines. New score: ${newScore}`);
    }

    if (newScore >= scoreNeeded) {
      setGameOver(true);
      setGameStatus('win');
    }
  }, [score, scoreNeeded]);

  useEffect(() => {
    if (gameOver) {
      // Handle game over logic, e.g., display message, reset game
      console.log(`Game Over! Status: ${gameStatus}`);
    }
  }, [gameOver, gameStatus]);


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
      {gameOver && (
        <div className="game-over-overlay">
          <p className="game-over-message">
            {gameStatus === 'win' ? 'You Win!' : 'Game Over!'}
          </p>
          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      )}
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
        onDragOver={!gameOver ? handleDragOver : null}
        onDrop={!gameOver ? handleDrop : null}
        onDragLeave={!gameOver ? () => setGhostShape(null) : null}
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
              draggable={!gameOver}
              onDragStart={!gameOver ? (e) => handleDragStart(e, shape, index) : null}
              onClick={!gameOver ? () => console.log('Shape preview clicked!', shape) : null}
              style={{ cursor: gameOver ? 'not-allowed' : 'pointer' }}
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