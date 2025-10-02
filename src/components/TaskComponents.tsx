import React, { useState, useEffect } from 'react';
import { Word, Settings, Category } from '../types';
import { formatTime, getContrastColor } from '../utils';

export function Dropdown({ trigger, children }: { trigger: React.ReactNode, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dropdown-container" 
      onMouseEnter={() => setIsOpen(true)} 
      onMouseLeave={() => setIsOpen(false)}>
      {trigger}
      {isOpen && <div className="dropdown-menu">{children}</div>}
    </div>
  );
}

export function TimeLeft({ word, onUpdate, onNotify, settings }: { 
  word: Word, 
  onUpdate: (updatedWord: Word) => void, 
  onNotify: (word: Word) => void, 
  settings: Settings
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    // If the task is completed, calculate its final state and stop the timer.
    if (word.completedDuration) {
      if (word.completeBy) {
        const completionTime = word.createdAt + word.completedDuration;
        const ms = word.completeBy - completionTime;
        if (ms < 0) {
          setClassName('priority-high');
          setTimeLeft(`Overdue by ${formatTime(Math.abs(ms))}`);
        } else {
          setTimeLeft(`Time left: ${formatTime(ms)}`);
        }
      }
      return; // Exit the effect, no interval needed.
    }

    if (!word.completeBy) {
      setTimeLeft('N/A');
      return;
    }

    const update = () => {
      const ms = word.completeBy - Date.now();

      if (ms < 0) {
        setClassName('priority-high');
        setTimeLeft(`Overdue by ${formatTime(Math.abs(ms))}`);
      } else {
        setTimeLeft(formatTime(ms));
        if (ms < (settings.warningTime * 60000)) {
          setClassName('priority-medium');
        } else {
          setClassName('');
        }
      }
    };

    update(); // Run once immediately to set the initial state
    const interval = setInterval(update, 1000); // Update every second
    return () => clearInterval(interval);
  }, [word, settings.warningTime]);

  return <span className={className}>{timeLeft}</span>;
}

export function TimeOpen({ startDate }: { startDate: number }) {
  const [timeOpen, setTimeOpen] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - startDate;
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      if (ms > sevenDaysInMs) {
        setClassName('priority-high'); // This class makes the text red
      } else {
        setClassName('');
      }

      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      setTimeOpen(`${days}d ${hours}h ${minutes}m`);
    };

    update();
    const interval = setInterval(update, 60000); // Update every minute is sufficient
    return () => clearInterval(interval);
  }, [startDate]);

  return <span className={className}>{timeOpen}</span>;
}

export function Stopwatch({ word, onTogglePause }: { word: Word, onTogglePause: (id: number) => void }) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const calculateElapsedTime = () => {
      if (word.isPaused) {
        return word.pausedDuration || 0;
      }
      const now = Date.now();
      const elapsed = (word.pausedDuration || 0) + (now - word.createdAt);
      return elapsed;
    };

    setElapsedTime(calculateElapsedTime());

    if (word.isPaused) {
      return; // Don't start the interval if paused
    }

    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [word.isPaused, word.createdAt, word.pausedDuration]);

  return (
    <div className="stopwatch-container">
      <span className="stopwatch">{formatTime(elapsedTime)}</span>
      <button onClick={() => onTogglePause(word.id)} className="pause-btn">
        {word.isPaused ? '▶' : '❚❚'}
      </button>
    </div>
  );
}

export function ManualStopwatch({ word, onUpdate }: { word: Word, onUpdate: (updatedWord: Word) => void }) {
  const [displayTime, setDisplayTime] = useState(word.manualTime || 0);

  useEffect(() => {
    if (!word.manualTimeRunning) {
      setDisplayTime(word.manualTime || 0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - (word.manualTimeStart || 0);
      setDisplayTime((word.manualTime || 0) + elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [word.manualTimeRunning, word.manualTime, word.manualTimeStart]);

  const handleToggle = () => {
    if (word.manualTimeRunning) {
      // Stopping
      const elapsed = Date.now() - (word.manualTimeStart || 0);
      onUpdate({ ...word, manualTime: (word.manualTime || 0) + elapsed, manualTimeRunning: false });
    } else {
      // Starting
      onUpdate({ ...word, manualTimeStart: Date.now(), manualTimeRunning: true });
    }
  };

  const handleReset = () => {
    onUpdate({ ...word, manualTime: 0, manualTimeRunning: false, manualTimeStart: 0 });
  };

  return (
    <div className="manual-stopwatch">
      <span className="time-display">{formatTime(displayTime)}</span><button className="icon-button" onClick={handleToggle} title={word.manualTimeRunning ? 'Stop Timer' : 'Start Timer'}><i className={`fas ${word.manualTimeRunning ? 'fa-stop' : 'fa-play'}`}></i></button>
      <button className="icon-button" onClick={handleReset} title="Reset Timer"><i className="fas fa-undo"></i></button>
    </div>
  );
}

export function TaskAccordionHeader({
  word, 
  settings, 
  onCategoryClick,
  onUpdate,
  onNotify,
  allWords
}: { 
  word: Word, settings: Settings, onCategoryClick: (e: React.MouseEvent, catId: number, parentId?: number) => void, onUpdate?: (updatedWord: Word) => void, onNotify?: (word: Word) => void, allWords: Word[]
}) {
  return (
    <>
      <div className="accordion-title-container">
        <span className="accordion-main-title">{word.text}</span>
        <span className="task-id-display">(ID: {word.id})</span>
        {(() => {
          if (!word.categoryId) return null;
          const category = settings.categories.find(c => c.id === word.categoryId);
          if (!category) return null;

          const parentCategory = category.parentId ? settings.categories.find(c => c.id === category.parentId) : null;

          return (
            <>
              {parentCategory && (
                <span 
                  className="category-pill parent-category-pill" 
                  onClick={(e) => onCategoryClick(e, parentCategory.id, undefined)}
                  style={{ 
                    backgroundColor: parentCategory.color || '#555',
                    color: getContrastColor(parentCategory.color) 
                  }}
                >
                  {parentCategory.name}
                </span>
              )}
              <span 
                className="category-pill child-category-pill" 
                onClick={(e) => onCategoryClick(e, category.id, parentCategory?.id)}
                style={{ 
                  backgroundColor: category.color || '#555',
                  color: getContrastColor(category.color) 
                }}
              >
                {category.name}
              </span>
            </>
          );
        })()}
        <span className={`priority-indicator priority-${(word.priority || 'Medium').toLowerCase()}`}>
          <span className="priority-dot"></span>
          {word.priority || 'Medium'}
        </span>
      </div>
      <div className="accordion-subtitle">
        <span className="timer-pill">
          <i className="fas fa-clock"></i>
          <TimeOpen startDate={word.createdAt} />
        </span>
        {word.completeBy && (
          <>
            <span className="due-date-pill">
              <i className="fas fa-calendar-alt"></i>
              Due: {new Date(word.completeBy).toLocaleDateString()}
            </span>
            <span className="timer-pill">
              <i className="fas fa-hourglass-half"></i>
              <TimeLeft word={word} onUpdate={onUpdate || (() => {})} onNotify={onNotify || (() => {})} settings={settings} />
            </span>
          </>
        )}
      </div>
      {word.startsTaskIdOnComplete && (
        (() => {
          const successorTask = allWords.find(w => w.id === word.startsTaskIdOnComplete);
          const isLoop = successorTask?.startsTaskIdOnComplete === word.id;
          return (
            <div className="linked-task-display">
              <i className={`fas ${isLoop ? 'fa-sync-alt' : 'fa-link'}`} title={isLoop ? 'This task is part of a loop.' : 'This task starts another.'}></i>
              <span>
                Completing starts: <strong>{successorTask?.text || 'Unknown Task'} (ID: {word.startsTaskIdOnComplete})</strong>
              </span>
            </div>
          );
        })()
      )}
    </>
  );
}

export function TaskAccordion({ 
  title, 
  children, 
  isOpen, 
  onToggle, 
  word, 
  settings, 
  completedWords,
  onUpdate,
  onNotify
}: { 
  title: React.ReactNode, children: React.ReactNode, isOpen: boolean, onToggle: () => void, word: Word, settings: Settings, completedWords: Word[], onUpdate?: (word: Word) => void, onNotify?: (word: Word) => void 
}) {
  const [content, headerActions] = React.Children.toArray(children);

  return (
    <div className="accordion">
      <div className="accordion-header-container">
        <div 
          className="accordion-header"
          onClick={onToggle}
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            const isInEditMode = settings.activeTaskTabs?.[word.id] === 'edit';
            const hasCompletedTasks = completedWords.length > 0;
            window.electronAPI.showTaskContextMenu({ wordId: word.id, x: e.clientX, y: e.clientY, isInEditMode, hasCompletedTasks });
          }}
        >
          <span className="accordion-icon"><i className={`fas ${isOpen ? 'fa-minus' : 'fa-plus'}`}></i></span>
          <h4 className="accordion-title">{title}</h4>          
        </div>
        {headerActions}
      </div>
      {isOpen && <div className="accordion-content">{content}</div>}
    </div>
  );
}