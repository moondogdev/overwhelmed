import React, { useRef, useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Word } from '../types';
import { getFontSize, getNewWordPosition } from '../utils';
import placeholderImage from "../assets/placeholder-image.jpg";

export function MemeView() {
  const { settings, words, setWords } = useAppContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordsRef = useRef<Word[]>([]);
  const [hoveredWordId, setHoveredWordId] = useState<number | null>(null);

  useEffect(() => {
    // This effect runs when `words` change. It's responsible for assigning
    // initial positions to any new words added while in Meme View.
    const wordsToPosition = words.filter(w => w.x === 0 && w.y === 0);
    if (wordsToPosition.length > 0) {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) return;

      const updatedWords = words.map(word => {
        if (word.x === 0 && word.y === 0) {
          const fontSize = getFontSize(words.indexOf(word), words.length, settings);
          context.font = `${fontSize}px ${settings.fontFamily}`;
          const metrics = context.measureText(word.text);
          const newWordMetrics = { width: metrics.width, height: fontSize };
          return { ...word, ...getNewWordPosition(canvas.width, canvas.height, newWordMetrics, wordsRef) };
        }
        return word;
      });
      setWords(updatedWords);
    }
  }, [words]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const redrawCanvas = (image: HTMLImageElement) => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      if (settings.isOverlayEnabled) {
        context.globalAlpha = settings.overlayOpacity;
        context.fillStyle = settings.overlayColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalAlpha = 1.0;
      }

      const updatedWords = words.map((word, index) => {
        let fontSize = getFontSize(index, words.length, settings);
        context.font = `${fontSize}px ${settings.fontFamily}`;

        const metrics = context.measureText(word.text);
        const availableWidth = canvas.width - 100;
        if (metrics.width > availableWidth) {
          fontSize = Math.floor(fontSize * (availableWidth / metrics.width));
          context.font = `${fontSize}px ${settings.fontFamily}`;
        }

        context.shadowColor = settings.shadowColor;
        context.shadowBlur = settings.shadowBlur;
        context.shadowOffsetX = settings.shadowOffsetX;
        context.shadowOffsetY = settings.shadowOffsetY;

        context.fillStyle = word.id === hoveredWordId ? '#FFD700' : settings.fontColor;
        context.textAlign = "center";
        context.fillText(word.text, word.x, word.y);

        const finalMetrics = context.measureText(word.text);

        if (settings.isDebugModeEnabled && settings.currentView === 'meme') {
          context.strokeStyle = 'red';
          context.lineWidth = 1;
          context.strokeRect(word.x - finalMetrics.width / 2, word.y - fontSize, finalMetrics.width, fontSize);
        }

        return { ...word, width: finalMetrics.width, height: fontSize };
      });
      wordsRef.current = updatedWords;
    };

    const image = new Image();
    image.src = placeholderImage;
    image.onload = () => redrawCanvas(image);
    if (image.complete) {
      redrawCanvas(image);
    }
  }, [words, settings, hoveredWordId]);

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the canvas content as a PNG data URL
    const dataUrl = canvas.toDataURL('image/png');
    // Send the data to the main process to be saved
    window.electronAPI.saveFile(dataUrl);
  };

  const handleRandomizeLayout = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newWords: Word[] = [];
    const tempWordsRef = { current: newWords };

    const originalWordsRefCurrent = wordsRef.current;
    wordsRef.current = tempWordsRef.current;

    words.forEach(word => {
      const { x, y } = getNewWordPosition(canvas.width, canvas.height, { width: word.width ?? 0, height: word.height ?? 0 }, wordsRef);
      const newWord = { ...word, x, y };
      newWords.push(newWord);
    });

    wordsRef.current = originalWordsRefCurrent;
    setWords(newWords);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const foundWord = [...wordsRef.current].reverse().find(word => {
      if (!word.width || !word.height) return false;
      const wordLeft = word.x - word.width / 2;
      const wordRight = word.x + word.width / 2;
      const wordTop = word.y - word.height;
      const wordBottom = word.y;
      return x >= wordLeft && x <= wordRight && y >= wordTop && y <= wordBottom;
    });

    setHoveredWordId(foundWord ? foundWord.id : null);
    canvas.style.cursor = foundWord ? 'pointer' : 'default';
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredWordId) {
      const clickedWord = words.find(w => w.id === hoveredWordId);
      if (clickedWord) {
        const activeBrowser = settings.browsers[settings.activeBrowserIndex];
        const url = clickedWord.url || `https://www.google.com/search?q=${encodeURIComponent(clickedWord.text)}`;
        window.electronAPI.openExternalLink({ url, browserPath: activeBrowser?.path });
      }
    }
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!settings.isDebugModeEnabled) return;
    event.preventDefault();
    if (hoveredWordId) {
      const clickedWord = words.find(w => w.id === hoveredWordId);
      console.log('Inspecting word:', clickedWord);
      window.electronAPI.showContextMenu();
    }
  };

  return (
    <div className="canvas-container">
      <div className="canvas-actions">
        <button onClick={handleRandomizeLayout} title="Randomize Layout">
          <i className="fas fa-random"></i> Randomize Layout
        </button>
      </div>
      <button onClick={handleSaveImage} title="Save Image">
        <i className="fas fa-save"></i> Save as Image
      </button>
      <canvas
        ref={canvasRef}
        width={640} height={640}
        className="word-cloud-canvas"
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
        onMouseMove={handleMouseMove}
        title={hoveredWordId ? 'Open Link or Search Google' : ''} />
    </div>
  );
}