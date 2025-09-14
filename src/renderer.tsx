/// <reference path="./declarations.d.ts" />
import React, { useRef, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Import the placeholder image
import placeholderImage from "./assets/placeholder-image.jpg";

// Define the API exposed by the preload script
declare global {
  interface Window { electronAPI: { saveFile: (dataUrl: string) => Promise<void> } }
}

// Define the structure of a Word object for TypeScript
interface Word {
  id: number;
  text: string;
  x: number; // Add x coordinate
  y: number; // Add y coordinate
  // Add dimensions for hit detection
  width?: number;
  height?: number;
}

function App() {
  // Create a ref to hold the canvas DOM element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // A ref to hold the latest word data for the click handler
  const wordsRef = useRef<Word[]>([]);

  // State for the input field
  const [inputValue, setInputValue] = useState("");
  // State for the list of words
  const [words, setWords] = useState<Word[]>([]);
  // State for customization
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontColor, setFontColor] = useState("#FFFFFF");
  // State for the background image
  // State for text shadow
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowBlur, setShadowBlur] = useState(0);
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(0);


  // This single effect handles all canvas drawing and updates when `words` changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Define min/max font sizes for dynamic scaling.
    const MIN_FONT_SIZE = 20;
    const MAX_FONT_SIZE = 80;

    const getFontSize = (index: number, total: number) => {
      if (total <= 1) {
        return MAX_FONT_SIZE; // Only one word, make it the max size.
      }
      // This creates a linear scale from MAX_FONT_SIZE down to MIN_FONT_SIZE.
      const size = MAX_FONT_SIZE - (index / (total - 1)) * (MAX_FONT_SIZE - MIN_FONT_SIZE);
      return Math.round(size);
    };

    const redrawCanvas = (image: HTMLImageElement) => {
      // 1. Draw the background image.
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      // 2. Draw all the words on top.
      const updatedWords = words.map((word, index) => {
        const fontSize = getFontSize(index, words.length);
        // Apply shadow properties
        context.shadowColor = shadowColor;
        context.shadowBlur = shadowBlur;
        context.shadowOffsetX = shadowOffsetX;
        context.shadowOffsetY = shadowOffsetY;

        context.font = `${fontSize}px ${fontFamily}`;
        context.fillStyle = fontColor;
        context.textAlign = "center";
        context.fillText(word.text, word.x, word.y);

        // Measure and store the word's dimensions
        const metrics = context.measureText(word.text);
        return {
          ...word,
          width: metrics.width,
          height: fontSize, // Approximate height with font size
        };
      });
      // Update the ref for the click handler
      wordsRef.current = updatedWords;
    };

    const image = new Image();
    image.src = placeholderImage;
    image.onload = () => redrawCanvas(image);
    // If the image is already cached by the browser, onload might not fire.
    // This line ensures the redraw happens even if the src hasn't changed.
    if (image.complete) {
      redrawCanvas(image);
    }
  }, [words, fontFamily, fontColor, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY]); // Redraw when words, font, color, or image change

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const getNewWordPosition = (canvasWidth: number, canvasHeight: number) => {
    const center_x = canvasWidth / 2;
    const center_y = canvasHeight / 2;
    // Define a radius for the "dead zone" in the center.
    const deadZoneRadius = 100;
    // Define a padding from the edge of the canvas to prevent text cutoff.
    const padding = 50;
    let x, y, distance;

    // Keep generating random points until we find one outside the dead zone.
    do {
      // Generate coordinates within the padded area.
      x = padding + Math.random() * (canvasWidth - padding * 2);
      y = padding + Math.random() * (canvasHeight - padding * 2);
      const dx = x - center_x;
      const dy = y - center_y;
      distance = Math.sqrt(dx * dx + dy * dy);
    } while (distance < deadZoneRadius);

    return { x, y };
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && inputValue.trim() !== "") {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get a position that avoids the center of the canvas.
      const { x, y } = getNewWordPosition(canvas.width, canvas.height);

      const newWord: Word = {
        id: Date.now(), // Use a timestamp for a unique ID
        text: inputValue.trim(),
        x,
        y,
      };
      setWords((prevWords) => [...prevWords, newWord]);
      setInputValue(""); // Clear the input field
    }
  };

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the canvas content as a PNG data URL
    const dataUrl = canvas.toDataURL('image/png');
    // Send the data to the main process to be saved
    window.electronAPI.saveFile(dataUrl);
  };

  const applyDefaultShadow = () => {
    setShadowColor("#000000");
    setShadowBlur(7);
    setShadowOffsetX(5);
    setShadowOffsetY(5);
  };

  const resetShadow = () => {
    setShadowColor("#000000");
    setShadowBlur(0);
    setShadowOffsetX(0);
    setShadowOffsetY(0);
  };

  const handleClearAll = () => {
    setWords([]);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find if a word was clicked (iterate in reverse to find the top-most word)
    const clickedWord = [...wordsRef.current].reverse().find(word => {
      if (!word.width || !word.height) return false;

      // Calculate bounding box, accounting for textAlign='center'
      const wordLeft = word.x - word.width / 2;
      const wordRight = word.x + word.width / 2;
      const wordTop = word.y - word.height; // Approximation
      const wordBottom = word.y;

      return x >= wordLeft && x <= wordRight && y >= wordTop && y <= wordBottom;
    });

    if (clickedWord) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(clickedWord.text)}`;
      window.open(searchUrl, '_blank');
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <h1>Overwhelmed</h1>
        <canvas ref={canvasRef} width={640} height={640} className="word-cloud-canvas" onClick={handleCanvasClick} />
      </div>
      <div className="sidebar">
        <h2>Controls</h2>
        <input
          type="text"
          placeholder="Enter a word and press Enter"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
        />
        <h3>Settings</h3>
        <label>
          Font Family:
          <input
            type="text"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          />
        </label>
        <button onClick={handleSaveImage}>Save Image</button>
        <label>
          Font Color:
          <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} />
        </label>

        <h3>Shadow Settings</h3>
        <button onClick={applyDefaultShadow}>Apply Default Shadow</button>
        <button onClick={resetShadow}>Reset Shadow</button>
        <label>
          Shadow Color:
          <input type="color" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} />
        </label>
        <label>
          Shadow Blur: {shadowBlur}px
          <input
            type="range"
            min="0"
            max="50"
            value={shadowBlur}
            onChange={(e) => setShadowBlur(Number(e.target.value))}
          />
        </label>
        <label>
          Offset X: {shadowOffsetX}px
          <input
            type="range"
            min="-50"
            max="50"
            value={shadowOffsetX}
            onChange={(e) => setShadowOffsetX(Number(e.target.value))}
          />
        </label>
        <label>
          Offset Y: {shadowOffsetY}px
          <input type="range" min="-50" max="50" value={shadowOffsetY} onChange={(e) => setShadowOffsetY(Number(e.target.value))} />
        </label>

        <h3>Priority List</h3>
        <button onClick={handleClearAll}>Clear All Words</button>
        <div className="priority-list">
          {words.map((word) => (
            <div key={word.id} className="priority-list-item">
              {word.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Create a root element for React to mount into
const rootElement = document.createElement('div');
rootElement.id = 'root';
document.body.appendChild(rootElement);

const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);