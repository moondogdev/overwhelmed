import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, Settings, Category } from '../types';
import { formatTime, getContrastColor, calculateNextOccurrence, formatTimestamp } from '../utils';

import './styles/Finances.css';
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
  task: Task, settings: Settings, onCategoryClick: (e: React.MouseEvent, catId: number, parentId?: number) => void, onUpdate?: (updatedTask: Task, options?: { action: string }) => void, onNotify?: (task: Task) => void, allTasks: Task[]
  isSelected: boolean,
  onToggleSelection: (taskId: number) => void,
}) {
  const [confirmingUncategorize, setConfirmingUncategorize] = useState(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isTransaction = useMemo(() => {
    if (!task.categoryId) return false;    
    const category = settings.categories.find(c => c.id === task.categoryId);
    const parentCategory = category?.parentId ? settings.categories.find(c => c.id === category.parentId) : category;
    return parentCategory?.name === 'Transactions';
  }, [task.categoryId, settings.categories]);
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
        {!isTransaction && (() => {
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
        {!isTransaction && task.accountId && (() => {
          const account = settings.accounts.find(acc => acc.id === task.accountId);
          if (!account) return null;
          return (
            <span
              className="category-pill account-pill"
              title={`Account: ${account.name}`}
            ><i className="fas fa-university"></i> {account.name}</span>
          );
        })()}
        {!isTransaction && (
          <span className={`priority-indicator priority-${(task.priority || 'Medium').toLowerCase()}`} title={`Priority: ${task.priority || 'Medium'}`}>
            <span className="priority-dot"></span>
          </span>
        )}
      </div>
      <div className="accordion-subtitle">
        {isTransaction && (
          <>
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
                      style={{ backgroundColor: parentCategory.color || '#555', color: getContrastColor(parentCategory.color) }}
                    >
                      {parentCategory.name}
                    </span>
                  )}
                  <span 
                    className="category-pill child-category-pill" 
                    onClick={(e) => onCategoryClick(e, category.id, parentCategory?.id)}
                    style={{ backgroundColor: category.color || '#555', color: getContrastColor(category.color) }}
                  >
                    {category.name}
                  </span>
                </>
              );
            })()}
            {task.accountId && (() => {
              const account = settings.accounts.find(acc => acc.id === task.accountId);
              if (!account) return null;
              return (
                <span className="category-pill account-pill" title={`Account: ${account.name}`}>
                  <i className="fas fa-university"></i> {account.name}</span>
              );
            })()}
            {task.taxCategoryId && (() => {
              const taxCategory = settings.taxCategories?.find(tc => tc.id === task.taxCategoryId);
              if (!taxCategory) return null;
              return (
                <span 
                  className={`category-pill tax-category-pill clickable-pill ${confirmingUncategorize ? 'confirm-delete' : ''}`} 
                  title={confirmingUncategorize ? 'Click again to confirm removal' : `Tax Category: ${taxCategory.name} (Click to remove)`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent accordion toggle
                    if (confirmingUncategorize) {
                      if (onUpdate) {
                        onUpdate({ ...task, taxCategoryId: undefined }, { action: 'tax-uncategorize' });
                      }
                      setConfirmingUncategorize(false);
                      if (confirmTimeoutRef.current) {
                        clearTimeout(confirmTimeoutRef.current);
                      }
                    } else {
                      setConfirmingUncategorize(true);
                      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                      confirmTimeoutRef.current = setTimeout(() => setConfirmingUncategorize(false), 3000);
                    }
                  }}
                >
                  <i className={`fas ${confirmingUncategorize ? 'fa-check' : 'fa-tags'}`}></i> 
                  {confirmingUncategorize ? 'Confirm?' : taxCategory.name}
                </span>
              );
            })()}
            {task.incomeType && (task.transactionType === 'income' || (task.payRate || 0) > 0) && (() => {
              let pillText = '';
              let pillClass = '';
              let iconClass = 'fa-file-invoice-dollar'; // Default icon

              switch (task.incomeType) {
                case 'w2':
                  pillText = 'W-2 Wage';
                  pillClass = 'w2-wage-pill';
                  break;
                case 'business':
                  pillText = 'Business Earning';
                  pillClass = 'business-earning-pill';
                  break;
                case 'reimbursement':
                  pillText = 'Reimbursement';
                  pillClass = 'reimbursement-pill';
                  iconClass = 'fa-receipt'; // A more fitting icon for reimbursements
                  break;
              }
              if (!pillText) return null;
              return (
                <span className={`category-pill income-type-pill ${pillClass}`} title={`Income Type: ${pillText}`}>
                  <i className={`fas ${iconClass}`}></i> {pillText}
                </span>
              );
            })()}
          </>
        )}
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
        {!task.completeBy && task.transactionAmount && task.transactionAmount !== 0 && (
          <span className="due-date-pill">
            <i className="fas fa-calendar-alt"></i>
            Date: {new Date(task.openDate).toLocaleDateString()}
          </span>
        )}
        {task.transactionType && task.transactionType !== 'none' && task.transactionAmount !== 0 && (() => {
          const amount = task.transactionAmount || 0;
          if (task.transactionType === 'transfer') {
            return (
              <span className="transaction-pill transfer">
                <i className="fas fa-exchange-alt"></i>
                {amount > 0 ? '+' : ''}${amount.toFixed(2)}
              </span>
            );
          }
          if (task.transactionType === 'income') {
            return (
              <span className="transaction-pill income">
                <i className="fas fa-arrow-up"></i>
                ${Math.abs(amount).toFixed(2)}
              </span>
            );
          }
          return (
            <span className="transaction-pill expense"><i className="fas fa-arrow-down"></i>${Math.abs(amount).toFixed(2)}</span>
          );
        })()}
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
  title: React.ReactNode, children: React.ReactNode, isOpen: boolean, onToggle: () => void, task: Task, settings: Settings, completedTasks: Task[], onUpdate?: (task: Task, options?: { action: string }) => void, onNotify?: (task: Task) => void
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
            
            const category = settings.categories.find(c => c.id === task.categoryId);
            const parentCategory = category?.parentId ? settings.categories.find(c => c.id === category.parentId) : category;
            const isTransaction = parentCategory?.name === 'Transactions';
            const isIncome = (task.transactionAmount || 0) > 0 || ((task.payRate || 0) > 0);

            window.electronAPI.showTaskContextMenu({ 
              taskId: task.id, 
              x: e.clientX, y: e.clientY, 
              isInEditMode, hasCompletedTasks, 
              categories: settings.categories,
              taxCategories: isTransaction ? settings.taxCategories : undefined, // Only send tax categories for transactions
              isIncome: isIncome,
              incomeType: task.incomeType,
            });
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