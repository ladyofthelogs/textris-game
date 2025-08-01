import React, { useState, useEffect, useCallback } from 'react';

// Helper function to generate a random letter
const getRandomLetter = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return alphabet[Math.floor(Math.random() * alphabet.length)];
};

// Helper function to generate a random shape
const generateRandomShape = () => {
  const shapeTypes = [
    [[1, 1], [1, 1]], // 2x2 block
    [[1, 1, 1]], // 1x3 block
    [[1], [1], [1]], // 3x1 block
    [[1, 1, 0], [0, 1, 1]], // Z shape (horizontal)
    [[0, 1], [1, 1], [1, 0]], // Z shape (vertical)
    [[0, 1, 1], [1, 1, 0]], // S shape (horizontal)
    [[1, 0], [1, 1], [0, 1]], // S shape (vertical)
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
  const [draggedShapeClickedRow, setDraggedShapeClickedRow] = useState(null);
  const [draggedShapeClickedCol, setDraggedShapeClickedCol] = useState(null);
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
    console.log('handleDragStart - Shape:', shape, 'Index:', index);
    const previewRect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - previewRect.left;
    const offsetY = e.clientY - previewRect.top;
    console.log('handleDragStart - offsetX:', offsetX, 'offsetY:', offsetY);

    // Calculate the cell within the shape-preview that was clicked
    // Assuming shape-cell size is 20px as defined in globals.css
    const clickedShapeCol = Math.floor(offsetX / 20);
    const clickedShapeRow = Math.floor(offsetY / 20);

    e.dataTransfer.setData('text/plain', index); // Only transfer index, shape is in state
    e.dataTransfer.effectAllowed = 'move'; // Explicitly allow 'move' effect
    setDraggedShape(shape);
    setDraggedShapeIndex(index);
    setDraggedShapeClickedRow(clickedShapeRow);
    setDraggedShapeClickedCol(clickedShapeCol);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!draggedShape) {
      console.log('handleDragOver - No draggedShape in state, returning.');
      return;
    }
    const currentDraggedShape = draggedShape;
    console.log('handleDragOver - currentDraggedShape:', currentDraggedShape);

    const gameGrid = e.currentTarget;
    const gridRect = gameGrid.getBoundingClientRect();
    const cellSize = 40;

    const mouseX = e.clientX - gridRect.left;
    const mouseY = e.clientY - gridRect.top;

    // Calculate the top-left corner of the shape relative to the grid
    // This is where the shape's (0,0) cell would be placed
    let startCol = Math.floor((mouseX - (draggedShapeClickedCol * 20)) / cellSize);
    let startRow = Math.floor((mouseY - (draggedShapeClickedRow * 20)) / cellSize);

    console.log(`handleDragOver - MouseX: ${mouseX}, MouseY: ${mouseY}, Calculated StartRow: ${startRow}, Calculated StartCol: ${startCol}`);
    console.log('handleDragOver - draggedShapeClickedRow:', draggedShapeClickedRow, 'draggedShapeClickedCol:', draggedShapeClickedCol);

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

    console.log('handleDragOver - Can Place:', canPlace, 'New Ghost Shape:', newGhostShape);

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
    console.log('handleDrop - Drop event triggered.');
    if (!ghostShape) {
      console.log('handleDrop - No ghostShape, cannot drop.');
      return;
    }

    if (!draggedShape || draggedShapeIndex === null) {
      console.log('handleDrop - No draggedShape or draggedShapeIndex in state, cannot drop.');
      return;
    }
    const shape = draggedShape;
    const index = draggedShapeIndex;
    console.log('handleDrop - shape:', shape, 'index:', index);

    const newGrid = grid.map(row => [...row]);

    // The ghostShape already contains the adjusted coordinates, so we can use its first element
    // as the top-left placement for the actual shape.
    const startRow = ghostShape[0].row;
    const startCol = ghostShape[0].col;

    console.log(`handleDrop - Dropping shape at startRow: ${startRow}, startCol: ${startCol}`);

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== null) {
          const gridRow = startRow + r;
          const gridCol = startCol + c;
          newGrid[gridRow][gridCol] = shape[r][c];
          console.log(`handleDrop - Placed ${shape[r][c]} at [${gridRow}, ${gridCol}]`);
        }
      }
    }

    setGrid(newGrid);
    console.log('handleDrop - Grid updated:', newGrid);

    setUpcomingShapes((prevShapes) => {
      const updatedShapes = prevShapes.filter((_, i) => i !== index);
      // Add a new random shape if there are less than 3 upcoming shapes
      if (updatedShapes.length < 3) {
        updatedShapes.push(generateRandomShape());
      }
      console.log('handleDrop - Upcoming shapes updated:', updatedShapes);
      return updatedShapes;
    });

    setDraggedShape(null);
    setDraggedShapeIndex(null);
    setDraggedShapeClickedRow(null);
    setDraggedShapeClickedCol(null);
    setGhostShape(null);
    console.log('handleDrop - Drag state reset.');
    checkGridForMatches(newGrid);
  };

  const rotateShape = (shape) => {
    const numRows = shape.length;
    const numCols = shape[0].length;

    // Create a new array for the rotated shape
    const rotatedShape = Array(numCols).fill(null).map(() => Array(numRows).fill(null));

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        // Rotate 90 degrees clockwise
        rotatedShape[c][numRows - 1 - r] = shape[r][c];
      }
    }

    // Trim null rows/columns to maintain shape integrity
    let minRow = numCols;
    let maxRow = -1;
    let minCol = numRows;
    let maxCol = -1;

    for (let r = 0; r < numCols; r++) {
      for (let c = 0; c < numRows; c++) {
        if (rotatedShape[r][c] !== null) {
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r);
          minCol = Math.min(minCol, c);
          maxCol = Math.max(maxCol, c);
        }
      }
    }

    if (minRow > maxRow || minCol > maxCol) {
      // Shape is empty, return an empty shape or original shape
      return shape;
    }

    const trimmedShape = [];
    for (let r = minRow; r <= maxRow; r++) {
      const newRow = [];
      for (let c = minCol; c <= maxCol; c++) {
        newRow.push(rotatedShape[r][c]);
      }
      trimmedShape.push(newRow);
    }
    return trimmedShape;
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
    setDraggedShapeClickedRow(null);
    setDraggedShapeClickedCol(null);
    setGhostShape(null);
  };

  const renderShape = (shape) => {
    return (
      <div
        className="shape-grid"
        style={{
          gridTemplateColumns: `repeat(${shape[0] ? shape[0].length : 0}, 20px)`,
          gridTemplateRows: `repeat(${shape.length}, 20px)`,
        }}
      >
        {shape.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((cell, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`} className="shape-cell">
                {cell}
              </div>
            ))}
          </React.Fragment>
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
              onClick={!gameOver ? () => {
                const rotated = rotateShape(shape);
                setUpcomingShapes(prevShapes => {
                  const newShapes = [...prevShapes];
                  newShapes[index] = rotated;
                  return newShapes;
                });
              } : null}
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