import React, { useState, useMemo } from 'react';
import { formatTime } from '../utils';
import { useAppContext } from '../contexts/AppContext';
import { ChecklistSection, ChecklistItem, TimeLogEntry, Word } from '../types';
import './styles/MiniPlayer.css';

interface MiniPlayerProps {}

export const MiniPlayer: React.FC<MiniPlayerProps> = () => { 
  const {
    activeTimerWordId,
    activeTimerEntry,
    activeTimerLiveTime,
    handleGlobalToggleTimer,
    handleGlobalStopTimer,
    handleGlobalResetTimer,
    navigateToTask,
    handlePreviousEntry,
    handleNextEntry,
    handleNextTask,
    handlePreviousTask,
    handleNextChapter,
    handlePreviousChapter,
    handlePostLog,
    handlePostAndResetLog,
    handleResetAllLogEntries,
    handlePostAndComplete,
    words, // Get all words to find the task title
    setIsWorkSessionManagerOpen, // Get the handler to open the modal
    primedTaskId, // The ID of the task that is "on deck"
    handlePrimeTask, // We don't use this here, but it's part of the context
    settings,
    showToast,
    handleWordUpdate, // Get the global word update handler
  } = useAppContext();
  
  const [isEntryListVisible, setIsEntryListVisible] = useState(false);
  const [isActionsListVisible, setIsActionsListVisible] = useState(false);

  const isTimerActive = activeTimerWordId && activeTimerEntry;

  // Determine the task to display: the active one, or the primed one if no timer is active.
  const taskForDisplayId = activeTimerWordId ?? primedTaskId;
  const activeTask = taskForDisplayId ? words.find(w => w.id === taskForDisplayId) : null;

  // If a timer is active, find the live entry. Otherwise, find the first playable entry of the primed task.
  const currentEntryForDisplay = isTimerActive 
    ? activeTimerEntry 
    : activeTask?.timeLog?.find(e => e.type !== 'header');

  // Guard all subsequent calculations on activeTask existing.
  const taskTitle = activeTask ? activeTask.text : 'No Active Task';
  const isRunning = activeTask && isTimerActive ? (activeTask.timeLog?.find(e => e.id === activeTimerEntry?.id)?.isRunning ?? false) : false;
  const timeLogTitle = activeTask?.timeLogTitle;

  let checklistProgress: string | null = null;
  if (activeTask && activeTask.checklist && activeTask.checklist.length > 0) {
    let totalItems = 0;
    let completedItems = 0;
    if ('items' in activeTask.checklist[0]) { // New section-based format
      (activeTask.checklist as ChecklistSection[]).forEach(section => {
        totalItems += section.items.length;
        completedItems += section.items.filter(item => item.isCompleted).length;
      });
    } else { // Old flat list format
      totalItems = activeTask.checklist.length;
      completedItems = (activeTask.checklist as ChecklistItem[]).filter(item => item.isCompleted).length;
    }
    if (totalItems > 0) {
      checklistProgress = `Checklist (${completedItems}/${totalItems})`;
    }
  }

  const currentSectionTitle = useMemo(() => {
    if (!activeTask || !currentEntryForDisplay || !activeTask.timeLog || !activeTask.checklist) return null;
  
    const currentIndex = activeTask.timeLog.findIndex(e => e.id === currentEntryForDisplay.id);
    if (currentIndex === -1) return null;
  
    // Search backwards from the current entry to find the last header.
    for (let i = currentIndex; i >= 0; i--) {
      if (activeTask.timeLog[i].type === 'header') {
        const sectionTitle = activeTask.timeLog[i].description;
        // Now find the corresponding section in the original checklist to get its progress
        const checklistSections = 'items' in activeTask.checklist[0] ? activeTask.checklist as ChecklistSection[] : [{ id: 1, title: 'Checklist', items: activeTask.checklist as ChecklistItem[] }];
        const matchingSection = checklistSections.find(sec => sec.title === sectionTitle);
        
        if (matchingSection) {
          const completedItems = matchingSection.items.filter(item => item.isCompleted).length;
          const totalItems = matchingSection.items.length;
          return `${sectionTitle} (${completedItems}/${totalItems})`;
        }
        return sectionTitle; // Fallback to just the title if no match is found
      }
    }
    return null; // No header found before this item
  }, [activeTask, currentEntryForDisplay]);
  // --- NEW LOGIC for In-Task Entry Navigation ---
  const timeLog = activeTask?.timeLog || [];
  const currentIndex = activeTask && isTimerActive ? timeLog.findIndex(e => e.id === activeTimerEntry?.id) : -1;

  // Find the index of the next and previous *playable* entries, skipping headers.
  const nextPlayableIndex = useMemo(() => 
    timeLog.findIndex((entry, index) => index > currentIndex && entry.type !== 'header'), 
    [timeLog, currentIndex]
  );
  const prevPlayableIndex = useMemo(() => 
    timeLog.slice(0, currentIndex).reverse().findIndex(entry => entry.type !== 'header'), 
    [timeLog, currentIndex]
  );

  const canGoNext = nextPlayableIndex !== -1 && nextPlayableIndex < timeLog.length;
  const canGoPrevious = prevPlayableIndex !== -1 && (currentIndex - 1 - prevPlayableIndex) >= 0;

  const nextEntryDescription = canGoNext ? timeLog[nextPlayableIndex].description : null;
  const previousEntryDescription = canGoPrevious ? timeLog[currentIndex - 1 - prevPlayableIndex].description : null;

  const groupedTimeLog = useMemo(() => {
    if (!timeLog || timeLog.length === 0) return [];

    const groups: { header: string; entries: TimeLogEntry[] }[] = [];
    let currentGroup: { header: string; entries: TimeLogEntry[] } | null = null;

    timeLog.forEach(entry => {
      if (entry.type === 'header') {
        // A new header marks the start of a new group
        currentGroup = { header: entry.description, entries: [] };
        groups.push(currentGroup);
      } else {
        // If we haven't found a header yet, create a default "Uncategorized" group
        if (!currentGroup) {
          currentGroup = { header: 'Uncategorized', entries: [] };
          groups.push(currentGroup);
        }
        // Add the entry to the current group
        currentGroup.entries.push(entry);
      }
    });

    return groups.filter(group => group.entries.length > 0); // Only return groups that have entries
  }, [timeLog]);

  // --- END NEW LOGIC ---

  const totalTime = useMemo(() => {
    if (!activeTask || !activeTask.timeLog) return 0;
    const isThisEntryRunning = activeTimerWordId === activeTask.id && activeTimerEntry;
    return activeTask.timeLog.reduce((sum, entry) => sum + entry.duration, 0) + (isThisEntryRunning ? (activeTimerLiveTime - activeTimerEntry.duration) : 0);
  }, [activeTask, activeTimerWordId, activeTimerEntry, activeTimerLiveTime]);

  return (
    <div className="mini-player">
      {activeTask && currentEntryForDisplay ? (
        <>
          <div className="mini-player-info-wrapper">
            <div className="mini-player-info-main">
              <div 
                className="mini-player-task-title clickable" 
                onClick={() => navigateToTask(taskForDisplayId)}
                title="Go to Task"
              >
                <span className="mini-player-label">Task:</span> {taskTitle}
              </div>
              {currentSectionTitle && <div className="mini-player-subtitle section-title">Chapter: {currentSectionTitle}</div>}              
              {timeLogTitle && <div className="mini-player-subtitle">Playlist: {timeLogTitle}</div>}
            </div>
            <div className="mini-player-info-secondary">
              <div className="mini-player-description">
                <span className="mini-player-label">Current:</span> {currentEntryForDisplay.description}
              </div>
            </div>
            <div className="mini-player-timer-line">
              <span className="mini-player-label">Timer:</span>
              <div className={`mini-player-time ${!isTimerActive ? 'idle-time' : ''}`}>
                {isTimerActive ? formatTime(activeTimerLiveTime) : formatTime(currentEntryForDisplay.duration)}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="mini-player-info idle">
          <div className="mini-player-task-title">No Active Timer</div>
          <div className="mini-player-description">Start a timer to begin a session.</div>
        </div>
      )}
      <div className="mini-player-controls">
        <button 
          className="icon-button" 
          title="Work Session"
          onClick={() => setIsWorkSessionManagerOpen(true)}
        >
          <i className="fas fa-list-ol"></i>
        </button>
        <div 
          className="mini-player-dropdown-container"
          onMouseEnter={() => setIsEntryListVisible(true)}
          onMouseLeave={() => setIsEntryListVisible(false)}
        >
          <button
            className="icon-button"
            title="Select Entry"
            disabled={!taskForDisplayId || timeLog.length < 2}
          >
            <i className="fas fa-stream"></i>
          </button>
          {isEntryListVisible && taskForDisplayId && (
            <ul className="mini-player-entry-list">
              {groupedTimeLog.map((group, index) => (
                <React.Fragment key={group.header + index}>
                  {group.header !== 'Uncategorized' && <li className="entry-list-header">{group.header}</li>}
                  {group.entries.map(entry => (
                    <li 
                      key={entry.id} 
                      onClick={() => {
                        handleGlobalToggleTimer(taskForDisplayId, entry.id);
                        setIsEntryListVisible(false); // Close menu on click
                      }}
                      className={entry.id === activeTimerEntry?.id ? 'active' : ''}
                    >
                      {entry.description}
                    </li>
                  ))}
                </React.Fragment>
                ))}
            </ul>
          )}
        </div>
        <div className="mini-player-nav-control">
          <button 
            className="icon-button" 
            title="Previous Entry"
            onClick={handlePreviousEntry}
            disabled={!canGoPrevious}
          >
            <i className="fas fa-step-backward"></i>
          </button>
          {previousEntryDescription && <div className="nav-indicator prev">{previousEntryDescription}</div>}
        <button 
          className="icon-button chapter-nav" 
          title="Previous Chapter"
          onClick={handlePreviousChapter}
          disabled={!isTimerActive}
        >
          <i className="fas fa-backward"></i>
        </button>
        </div>
        <button 
          className="icon-button" 
          title="Pause Timer" 
          onClick={() => {
            if (isTimerActive) {
              handleGlobalToggleTimer(activeTimerWordId, activeTimerEntry.id);
            } else if (taskForDisplayId && currentEntryForDisplay) {
              handleGlobalToggleTimer(taskForDisplayId, currentEntryForDisplay.id);
            }
          }}
          disabled={!taskForDisplayId} // Only disable if there's no task at all
        >
          <i className={`fas ${isRunning ? 'fa-pause' : 'fa-play'}`}></i>
        </button>
        <div className="mini-player-nav-control">
          <button 
            className="icon-button" 
            title="Next Entry"
            onClick={handleNextEntry}
            disabled={!canGoNext}
          >
            <i className="fas fa-step-forward"></i>
          </button>
          {nextEntryDescription && <div className="nav-indicator next">{nextEntryDescription}</div>}
        <button 
          className="icon-button chapter-nav" 
          title="Next Chapter"
          onClick={handleNextChapter}
          disabled={!isTimerActive}
        >
          <i className="fas fa-forward"></i>
        </button>
        </div>
        <button 
          className="icon-button" 
          title="Previous Task"
          onClick={handlePreviousTask}
          disabled={(settings.workSessionQueue || []).indexOf(activeTimerWordId) <= 0}
        >
          <i className="fas fa-fast-backward"></i>
        </button>
        <button 
          className="icon-button" 
          title="Next Task"
          onClick={handleNextTask}
          disabled={(settings.workSessionQueue || []).indexOf(activeTimerWordId) < 0 || (settings.workSessionQueue || []).indexOf(activeTimerWordId) >= (settings.workSessionQueue || []).length - 1}
        >
          <i className="fas fa-fast-forward"></i>
        </button>
        <div 
          className="mini-player-dropdown-container"
          onMouseEnter={() => setIsActionsListVisible(true)}
          onMouseLeave={() => setIsActionsListVisible(false)}
        >
          <button
            className="icon-button"
            title="More Actions"
            disabled={!taskForDisplayId}
          >
            <i className="fas fa-ellipsis-v"></i>
          </button>
          {isActionsListVisible && (
            <ul className="mini-player-entry-list">
              {currentEntryForDisplay?.checklistItemId && (
                <>
                  <li onClick={() => { handlePostAndComplete(taskForDisplayId, currentEntryForDisplay.id, handleWordUpdate); showToast('Time posted and item completed!'); }}>Post and Complete</li>
                  <li className="entry-list-divider"></li>
                </>
              )}
              <li onClick={() => { handlePostLog(taskForDisplayId); showToast('Session logged!'); }}>Post and Clear</li>
              <li onClick={() => { handlePostAndResetLog(taskForDisplayId); showToast('Session logged and timer reset.'); }}>Post and Reset</li>
              <li onClick={() => { handleResetAllLogEntries(taskForDisplayId); showToast('All durations reset.'); }}>Reset All Durations</li>
              <li className="entry-list-divider"></li>
              <li onClick={() => {
                navigator.clipboard.writeText(formatTime(totalTime));
                showToast('Total time copied!');
              }}>Copy Total Time</li>
              <li onClick={() => {
                const text = timeLog.map(entry => `${entry.description}: ${formatTime(entry.duration)}`).join('\n');
                navigator.clipboard.writeText(text);
                showToast('Log copied as text!');
              }}>Copy Log as Text</li>
            </ul>
          )}
        </div>
        <button
          className="icon-button"
          title="Reset Timer"
          onClick={() => taskForDisplayId && currentEntryForDisplay && handleGlobalResetTimer(taskForDisplayId, currentEntryForDisplay.id)}
          disabled={!taskForDisplayId}
        >
          <i className="fas fa-undo"></i>
        </button>
        <button 
          className="icon-button" 
          title="Stop Timer" 
          onClick={() => isTimerActive && handleGlobalStopTimer()}
          disabled={!isTimerActive}
        >
          <i className="fas fa-stop"></i>
        </button>
        <button className="icon-button" title="Go to Task" onClick={() => taskForDisplayId && navigateToTask(taskForDisplayId)} disabled={!taskForDisplayId}>
          <i className="fas fa-arrow-up-right-from-square"></i>
        </button>
      </div>
    </div>
  );
};