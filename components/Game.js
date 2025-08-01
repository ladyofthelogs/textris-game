import React, { useState, useEffect, useCallback } from 'react';

// Helper function to generate a random letter
const getRandomLetter = () => {
  const vowels = 'AEIOU';
  const commonConsonants = 'RSTLN'; // Common consonants
  const lessCommonLetters = 'BCDFGHJKMPQVWXYZ'; // Less common letters

  // Adjust probabilities
  const letters = [
    ...Array(5).fill(vowels), // 50% chance for vowels
    ...Array(3).fill(commonConsonants), // 30% chance for common consonants
    ...Array(2).fill(lessCommonLetters), // 20% chance for less common letters
  ].flat();

  const chosenCategory = letters[Math.floor(Math.random() * letters.length)];
  return chosenCategory[Math.floor(Math.random() * chosenCategory.length)];
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
  const [clearingCells, setClearingCells] = useState([]); // Stores coordinates of cells being cleared
  const [isDragging, setIsDragging] = useState(false); // New state to track dragging

  const handleRestartGame = useCallback(() => {
    setScore(0);
    setTimeLeft(120); // Reset to 2 minutes
    setGrid(Array(8).fill(null).map(() => Array(8).fill(null)));
    const initialShapes = [];
    for (let i = 0; i < 3; i++) {
      initialShapes.push(generateRandomShape());
    }
    setUpcomingShapes(initialShapes);
    setDraggedShape(null);
    setDraggedShapeIndex(null);
    setDraggedShapeClickedRow(null);
    setDraggedShapeClickedCol(null);
    setGhostShape(null);
    setGameOver(false);
    setGameStatus('');
    setClearingCells([]);
    setIsDragging(false); // Reset dragging state on restart
  }, []);

  useEffect(() => {
    // Initialize upcoming shapes only once on component mount
    if (upcomingShapes.length === 0) {
      const initialShapes = [];
      for (let i = 0; i < 3; i++) {
        initialShapes.push(generateRandomShape());
      }
      setUpcomingShapes(initialShapes);
    }
  }, [upcomingShapes.length]); // Add upcomingShapes.length to dependency array

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
    // Assuming shape-cell size is 40px for the drag image
    const clickedShapeCol = Math.floor(offsetX / 40);
    const clickedShapeRow = Math.floor(offsetY / 40);

    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'drag-image-custom'; // Apply custom styling for the drag image
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px'; // Position off-screen
    dragImage.style.left = '-1000px';
    dragImage.style.pointerEvents = 'none'; // Ensure it doesn't interfere with mouse events
    dragImage.style.zIndex = '9999'; // Ensure it's on top

    // Render the shape into the custom drag image element
    const shapeGrid = document.createElement('div');
    shapeGrid.className = 'shape-grid';
    shapeGrid.style.gridTemplateColumns = `repeat(${shape[0] ? shape[0].length : 0}, 40px)`;
    shapeGrid.style.gridTemplateRows = `repeat(${shape.length}, 40px)`;
    // Remove background and border from shapeGrid, apply to individual cells
    shapeGrid.style.backgroundColor = 'transparent';
    shapeGrid.style.border = 'none';

    shape.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = `shape-cell ${cell === null ? 'hidden-cell' : ''}`;
        cellDiv.textContent = cell;
        // Apply enlarged, background, and border styles directly to cells
        cellDiv.style.width = '40px';
        cellDiv.style.height = '40px';
        cellDiv.style.fontSize = '1.5em';
        if (cell === null) {
          cellDiv.style.opacity = '0'; // Make empty cells transparent but maintain shape
        } else {
          cellDiv.style.backgroundColor = '#e3f2fd'; // Apply background to cells
          cellDiv.style.border = '1px solid #90caf9'; // Apply border to cells
          cellDiv.style.boxShadow = 'inset 0 0 3px rgba(0, 0, 0, 0.2)'; // Apply box-shadow to cells
        }
        shapeGrid.appendChild(cellDiv);
      });
    });

    dragImage.appendChild(shapeGrid);
    document.body.appendChild(dragImage);

    // Set the custom drag image
    e.dataTransfer.setDragImage(dragImage, offsetX * 2, offsetY * 2); // Scale offset by 2 since cells are 2x larger

    e.dataTransfer.setData('text/plain', index); // Only transfer index, shape is in state
    e.dataTransfer.effectAllowed = 'move'; // Explicitly allow 'move' effect
    setDraggedShape(shape);
    setDraggedShapeIndex(index);
    setDraggedShapeClickedRow(clickedShapeRow);
    setDraggedShapeClickedCol(clickedShapeCol);
    setIsDragging(true); // Set dragging state to true

    // Hide the original shape-preview element
    e.currentTarget.classList.add('hide-original-shape');
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
    // Calculate the top-left corner of the shape relative to the grid
    // This is where the shape's (0,0) cell would be placed
    // Adjust mouse position by the clicked cell's offset within the shape, then divide by grid cell size
    let startCol = Math.floor(mouseX / cellSize) - draggedShapeClickedCol;
    let startRow = Math.floor(mouseY / cellSize) - draggedShapeClickedRow;

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

    // The ghostShape contains the coordinates of where each cell of the shape should be placed.
    // We iterate through the ghostShape to place the cells.
    console.log(`handleDrop - Dropping shape using ghostShape coordinates.`);

    ghostShape.forEach(ghostCell => {
      const { row: gridRow, col: gridCol } = ghostCell;
      // Find the corresponding cell in the original draggedShape
      // This assumes ghostShape cells are ordered in a way that corresponds to the shape's internal structure
      // A more robust solution might involve storing the original shape's cell value in the ghostShape object
      // For now, we'll infer it based on the relative position from the first ghost cell
      const relativeRow = gridRow - ghostShape[0].row;
      const relativeCol = gridCol - ghostShape[0].col;

      if (shape[relativeRow] && shape[relativeRow][relativeCol] !== null) {
        newGrid[gridRow][gridCol] = shape[relativeRow][relativeCol];
        console.log(`handleDrop - Placed ${shape[relativeRow][relativeCol]} at [${gridRow}, ${gridCol}]`);
      }
    });

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

  const checkGridForMatches = useCallback(async (currentGrid) => { // Make it async
    let newScore = score;
    let updatedGrid = currentGrid.map(row => [...row]);
    let cellsToClear = []; // Collect all cells to be cleared for UX feedback
    let potentialWords = []; // Collect potential words for API validation

    // Check rows
    for (let r = 0; r < updatedGrid.length; r++) {
      if (updatedGrid[r].every(cell => cell !== null)) {
        for (let c = 0; c < updatedGrid[r].length; c++) {
          cellsToClear.push({ r, c });
        }
        newScore += 10; // Award points for clearing a row
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
          cellsToClear.push({ r, c });
        }
        newScore += 10; // Award points for clearing a column
      }
    }

    // Helper to find all words in a contiguous sequence
    const findAllWordsInSequence = (sequence, sequenceCells) => {
      for (let i = 0; i < sequence.length; i++) {
        for (let j = i + 2; j < sequence.length; j++) { // Words must be at least 3 letters
          const word = sequence.substring(i, j + 1);
          const cells = sequenceCells.slice(i, j + 1);
          potentialWords.push({ word, cells });
        }
      }
    };

    // Check for horizontal words
    for (let r = 0; r < updatedGrid.length; r++) {
      let currentSequence = '';
      let sequenceCells = [];
      for (let c = 0; c < updatedGrid[r].length; c++) {
        if (updatedGrid[r][c] !== null) {
          currentSequence += updatedGrid[r][c];
          sequenceCells.push({ r, c });
        } else {
          if (currentSequence.length >= 3) {
            findAllWordsInSequence(currentSequence, sequenceCells);
          }
          currentSequence = '';
          sequenceCells = [];
        }
      }
      // Check at the end of the row
      if (currentSequence.length >= 3) {
        findAllWordsInSequence(currentSequence, sequenceCells);
      }
    }

    // Check for vertical words
    for (let c = 0; c < updatedGrid[0].length; c++) {
      let currentSequence = '';
      let sequenceCells = [];
      for (let r = 0; r < updatedGrid.length; r++) {
        if (updatedGrid[r][c] !== null) {
          currentSequence += updatedGrid[r][c];
          sequenceCells.push({ r, c });
        } else {
          if (currentSequence.length >= 3) {
            findAllWordsInSequence(currentSequence, sequenceCells);
          }
          currentSequence = '';
          sequenceCells = [];
        }
      }
      // Check at the end of the column
      if (currentSequence.length >= 3) {
        findAllWordsInSequence(currentSequence, sequenceCells);
      }
    }

    // Process potential words asynchronously
    const validatedWords = [];
    for (const { word, cells } of potentialWords) {
      try {
        const response = await fetch(`/api/dictionary?word=${word}`);
        const data = await response.json();
        if (data.isValid) {
          validatedWords.push({ word, cells });
          newScore += word.length * 5; // Award points for valid word length
          console.log(`Formed valid word: ${word}. Awarded ${word.length * 5} points.`);
        } else {
          console.log(`"${word}" is not a valid word.`);
        }
      } catch (error) {
        console.error(`Error validating word "${word}":`, error);
      }
    }

    // Add cells from validated words to cellsToClear
    validatedWords.forEach(({ cells }) => {
      cellsToClear.push(...cells);
    });

    if (cellsToClear.length > 0) {
      setClearingCells(cellsToClear); // Set cells to be highlighted for clearing
      setTimeout(() => {
        const finalGrid = updatedGrid.map(row => [...row]);
        cellsToClear.forEach(cell => {
          finalGrid[cell.r][cell.c] = null; // Clear the cells
        });
        setGrid(finalGrid);
        setScore(newScore);
        setClearingCells([]); // Reset clearing cells
        console.log(`Cleared ${cellsToClear.length} cells. New score: ${newScore}`);
      }, 300); // Delay clearing for 300ms to allow animation to play out
    } else if (newScore !== score) {
      setScore(newScore); // Update score immediately if only score changed (e.g., from lines cleared without words)
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


  const handleDragEnd = (e) => {
    setDraggedShape(null);
    setDraggedShapeIndex(null);
    setDraggedShapeClickedRow(null);
    setDraggedShapeClickedCol(null);
    setGhostShape(null);
    setIsDragging(false); // Set dragging state to false

    // Remove the custom drag image if it exists
    const dragImage = document.querySelector('.drag-image-custom');
    if (dragImage) {
      dragImage.remove();
    }

    // Show the original shape-preview element
    if (e.currentTarget) {
      e.currentTarget.classList.remove('hide-original-shape');
    }
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
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`shape-cell ${cell === null ? 'hidden-cell' : ''}`}
              >
                {cell}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className={`game-container ${gameOver ? 'dimmed' : ''}`}>
      <h1>TEXTRIS</h1>
      {gameOver && (
        <div className="game-over-overlay">
          <p className="game-over-message">
            {gameStatus === 'win' ? 'You Win!' : 'Game Over!'}
          </p>
          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      )}
      <div className="game-info-top">
        <div className="score-display-main">
          {score}
        </div>
        <p>Time: {formatTime(timeLeft)}</p>
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
            const isClearing = clearingCells.some(
              (c) => c.r === rowIndex && c.c === colIndex
            );
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`grid-cell ${isGhost ? 'ghost-cell' : ''} ${isClearing ? 'clearing-cell' : ''}`}
              >
                {cell}
              </div>
            );
          })
        ))}
      </div>

      <div className="upcoming-shapes">
        <h2 style={{ color: '#007bff' }}>Tap to rotate</h2>
        <div className="shape-preview-container">
          {upcomingShapes.map((shape, index) => (
            <div
              key={index}
              className={`shape-preview ${isDragging && draggedShapeIndex === index ? 'is-dragged' : ''}`}
              draggable={!gameOver}
              onDragStart={!gameOver ? (e) => handleDragStart(e, shape, index) : null}
              onDragEnd={!gameOver ? (e) => handleDragEnd(e) : null}
              onClick={!gameOver ? () => {
                const rotated = rotateShape(shape);
                setUpcomingShapes(prevShapes => {
                  const newShapes = [...prevShapes];
                  newShapes[index] = rotated;
                  return newShapes;
                });
              } : null}
              style={{
                cursor: gameOver ? 'not-allowed' : 'pointer',
                // No dynamic width/height here, as the drag image handles scaling
              }}
            >
              {renderShape(shape)}
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleRestartGame} className="restart-button">Restart</button>
    </div>
  );
};

export default Game;