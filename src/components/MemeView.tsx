import React, { useRef, useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Task } from '../types';
import { getFontSize, getNewTaskPosition } from '../utils';
import placeholderImage from "../assets/placeholder-image.jpg";

export function MemeView() {
  const { settings, tasks, setTasks } = useAppContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tasksRef = useRef<Task[]>([]);
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);

  useEffect(() => {
    // This effect runs when `tasks` change. It's responsible for assigning
    // initial positions to any new tasks added while in Meme View.
    const tasksToPosition = tasks.filter(t => t.x === 0 && t.y === 0);
    if (tasksToPosition.length > 0) {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) return;

      const updatedTasks = tasks.map(task => {
        if (task.x === 0 && task.y === 0) {
          const fontSize = getFontSize(tasks.indexOf(task), tasks.length, settings);
          context.font = `${fontSize}px ${settings.fontFamily}`;
          const metrics = context.measureText(task.text);
          const newTaskMetrics = { width: metrics.width, height: fontSize };
          return { ...task, ...getNewTaskPosition(canvas.width, canvas.height, newTaskMetrics, tasksRef) };
        }
        return task;
      });
      setTasks(updatedTasks);
    }
  }, [tasks]);

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

      const updatedTasks = tasks.map((task, index) => {
        let fontSize = getFontSize(index, tasks.length, settings);
        context.font = `${fontSize}px ${settings.fontFamily}`;

        const metrics = context.measureText(task.text);
        const availableWidth = canvas.width - 100;
        if (metrics.width > availableWidth) {
          fontSize = Math.floor(fontSize * (availableWidth / metrics.width));
          context.font = `${fontSize}px ${settings.fontFamily}`;
        }

        context.shadowColor = settings.shadowColor;
        context.shadowBlur = settings.shadowBlur;
        context.shadowOffsetX = settings.shadowOffsetX;
        context.shadowOffsetY = settings.shadowOffsetY;

        context.fillStyle = task.id === hoveredTaskId ? '#FFD700' : settings.fontColor;
        context.textAlign = "center";
        context.fillText(task.text, task.x, task.y);

        const finalMetrics = context.measureText(task.text);

        if (settings.isDebugModeEnabled && settings.currentView === 'meme') {
          context.strokeStyle = 'red';
          context.lineWidth = 1;
          context.strokeRect(task.x - finalMetrics.width / 2, task.y - fontSize, finalMetrics.width, fontSize);
        }

        return { ...task, width: finalMetrics.width, height: fontSize };
      });
      tasksRef.current = updatedTasks;
    };

    const image = new Image();
    image.src = placeholderImage;
    image.onload = () => redrawCanvas(image);
    if (image.complete) {
      redrawCanvas(image);
    }
  }, [tasks, settings, hoveredTaskId]);

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

    const newTasks: Task[] = [];
    const tempTasksRef = { current: newTasks };

    const originalTasksRefCurrent = tasksRef.current;
    tasksRef.current = tempTasksRef.current;

    tasks.forEach(task => {
      const { x, y } = getNewTaskPosition(canvas.width, canvas.height, { width: task.width ?? 0, height: task.height ?? 0 }, tasksRef);
      const newTask = { ...task, x, y };
      newTasks.push(newTask);
    });

    tasksRef.current = originalTasksRefCurrent;
    setTasks(newTasks);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const foundTask = [...tasksRef.current].reverse().find(task => {
      if (!task.width || !task.height) return false;
      const taskLeft = task.x - task.width / 2;
      const taskRight = task.x + task.width / 2;
      const taskTop = task.y - task.height;
      const taskBottom = task.y;
      return x >= taskLeft && x <= taskRight && y >= taskTop && y <= taskBottom;
    });

    setHoveredTaskId(foundTask ? foundTask.id : null);
    canvas.style.cursor = foundTask ? 'pointer' : 'default';
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredTaskId) {
      const clickedTask = tasks.find(t => t.id === hoveredTaskId);
      if (clickedTask) {
        const activeBrowser = settings.browsers[settings.activeBrowserIndex];
        const url = clickedTask.url || `https://www.google.com/search?q=${encodeURIComponent(clickedTask.text)}`;
        window.electronAPI.openExternalLink({ url, browserPath: activeBrowser?.path });
      }
    }
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!settings.isDebugModeEnabled) return;
    event.preventDefault();
    if (hoveredTaskId) {
      const clickedTask = tasks.find(t => t.id === hoveredTaskId);      
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
        title={hoveredTaskId ? 'Open Link or Search Google' : ''} />
    </div>
  );
}