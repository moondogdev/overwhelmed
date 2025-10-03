import React, { useState, useEffect } from 'react';
import { Task, Settings, Category } from '../types';
import { formatTime, getContrastColor, calculateNextOccurrence, formatTimestamp } from '../utils';

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

export function TimeLeft({ task, onUpdate, onNotify, settings }: { 
  task: Task, 
  onUpdate: (updatedTask: Task) => void, 
  onNotify: (task: Task) => void, 
  settings: Settings
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    // If the task is completed, calculate its final state and stop the timer.
    if (task.completedDuration) {
      if (task.completeBy) {
        const completionTime = task.createdAt + task.completedDuration;
        const ms = task.completeBy - completionTime;
        if (ms < 0) {
          setClassName('priority-high');
          setTimeLeft(`Overdue by ${formatTime(Math.abs(ms))}`);
        } else {
          setTimeLeft(`Time left: ${formatTime(ms)}`);
        }
      }
      return; // Exit the effect, no interval needed.
    }

    if (!task.completeBy) {
      setTimeLeft('N/A');
      return;
    }

    const update = () => {
      const ms = task.completeBy - Date.now();

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
  }, [task, settings.warningTime]);

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

export function Stopwatch({ task, onTogglePause }: { task: Task, onTogglePause: (id: number) => void }) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const calculateElapsedTime = () => {
      if (task.isPaused) {
        return task.pausedDuration || 0;
      }
      const now = Date.now();
      const elapsed = (task.pausedDuration || 0) + (now - task.createdAt);
      return elapsed;
    };

    setElapsedTime(calculateElapsedTime());

    if (task.isPaused) {
      return; // Don't start the interval if paused
    }

    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [task.isPaused, task.createdAt, task.pausedDuration]);

  return (
    <div className="stopwatch-container">
      <span className="stopwatch">{formatTime(elapsedTime)}</span>
      <button onClick={() => onTogglePause(task.id)} className="pause-btn">
        {task.isPaused ? '▶' : '❚❚'}
      </button>
    </div>
  );
}

export function ManualStopwatch({ task, onUpdate }: { task: Task, onUpdate: (updatedTask: Task) => void }) {
  const [displayTime, setDisplayTime] = useState(task.manualTime || 0);

  useEffect(() => {
    if (!task.manualTimeRunning) {
      setDisplayTime(task.manualTime || 0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - (task.manualTimeStart || 0);
      setDisplayTime((task.manualTime || 0) + elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [task.manualTimeRunning, task.manualTime, task.manualTimeStart]);

  const handleToggle = () => {
    if (task.manualTimeRunning) {
      // Stopping
      const elapsed = Date.now() - (task.manualTimeStart || 0);
      onUpdate({ ...task, manualTime: (task.manualTime || 0) + elapsed, manualTimeRunning: false });
    } else {
      // Starting
      onUpdate({ ...task, manualTimeStart: Date.now(), manualTimeRunning: true });
    }
  };

  const handleReset = () => {
    onUpdate({ ...task, manualTime: 0, manualTimeRunning: false, manualTimeStart: 0 });
  };

  return (
    <div className="manual-stopwatch">
      <span className="time-display">{formatTime(displayTime)}</span><button className="icon-button" onClick={handleToggle} title={task.manualTimeRunning ? 'Stop Timer' : 'Start Timer'}><i className={`fas ${task.manualTimeRunning ? 'fa-stop' : 'fa-play'}`}></i></button>
      <button className="icon-button" onClick={handleReset} title="Reset Timer"><i className="fas fa-undo"></i></button>
    </div>
  );
}

export function TaskAccordionHeader({
  task, 
  settings, 
  onCategoryClick,
  onUpdate,
  onNotify,  
  allTasks,
  isSelected,
  onToggleSelection
}: { 
  task: Task, settings: Settings, onCategoryClick: (e: React.MouseEvent, catId: number, parentId?: number) => void, onUpdate?: (updatedTask: Task) => void, onNotify?: (task: Task) => void, allTasks: Task[]
  isSelected: boolean,
  onToggleSelection: (taskId: number) => void,
}) {
  return (
    <>
      <div className="accordion-title-container">
        <input
          type="checkbox"
          className="task-selection-checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(task.id)}
          onClick={(e) => e.stopPropagation()} // Prevent accordion from toggling
          title="Select this task for bulk actions"
        />
        <span className="accordion-main-title">{task.text}</span>        
        {(() => {
          if (!task.categoryId) return null;
          const category = settings.categories.find(c => c.id === task.categoryId);
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
        <span className={`priority-indicator priority-${(task.priority || 'Medium').toLowerCase()}`} title={`Priority: ${task.priority || 'Medium'}`}>
          <span className="priority-dot"></span>
        </span>
      </div>
      <div className="accordion-subtitle">
        {task.completeBy && (
          <>
            <span className="due-date-pill">
              <i className="fas fa-calendar-alt"></i>
              Due: {new Date(task.completeBy).toLocaleDateString()}
            </span>
            <span className="due-date-pill">
              <i className="fas fa-clock"></i>
              {new Date(task.completeBy).toLocaleTimeString()}
            </span>
            <span className="timer-pill">
              <i className="fas fa-hourglass-half"></i>
              <TimeLeft task={task} onUpdate={onUpdate || (() => {})} onNotify={onNotify || (() => {})} settings={settings} />
            </span>
          </>
        )}
        {(() => {
          let recurringText = '';
          if (task.isDailyRecurring) recurringText = 'Repeats Daily';
          else if (task.isWeeklyRecurring) recurringText = 'Repeats Weekly';
          else if (task.isMonthlyRecurring) recurringText = 'Repeats Monthly';
          else if (task.isYearlyRecurring) recurringText = 'Repeats Yearly';
          else if (task.isRecurring) recurringText = 'Re-occurs on Complete';

          if (recurringText) {
            const nextOccurrence = calculateNextOccurrence(task);
            return (
              <span className="timer-pill recurring-status-pill" title={nextOccurrence ? `Next occurrence: ${formatTimestamp(nextOccurrence.getTime())}` : 'Recurring task'}>
                <i className="fas fa-sync-alt"></i>
                {recurringText} {nextOccurrence && `(Next: ${nextOccurrence.toLocaleDateString()}, ${nextOccurrence.toLocaleTimeString()})`}
              </span>
            );
          }
          return null;
        })()}
      </div>
      {task.startsTaskIdOnComplete && (
        (() => {
          const successorTask = allTasks.find(t => t.id === task.startsTaskIdOnComplete);
          const isLoop = successorTask?.startsTaskIdOnComplete === task.id;
          return (
            <div className="linked-task-display">
              <i className={`fas ${isLoop ? 'fa-sync-alt' : 'fa-link'}`} title={isLoop ? 'This task is part of a loop.' : 'This task starts another.'}></i>
              <span>
                Completing starts: <strong>{successorTask?.text || 'Unknown Task'} (ID: {task.startsTaskIdOnComplete})</strong>
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
  task, 
  settings, 
  completedTasks,
  onUpdate,
  onNotify
}: { 
  title: React.ReactNode, children: React.ReactNode, isOpen: boolean, onToggle: () => void, task: Task, settings: Settings, completedTasks: Task[], onUpdate?: (task: Task) => void, onNotify?: (task: Task) => void 
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
            const isInEditMode = settings.activeTaskTabs?.[task.id] === 'edit';
            const hasCompletedTasks = completedTasks.length > 0;
            window.electronAPI.showTaskContextMenu({ taskId: task.id, x: e.clientX, y: e.clientY, isInEditMode, hasCompletedTasks, categories: settings.categories });
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