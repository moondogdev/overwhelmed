import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Word, ChecklistSection, ChecklistItem } from '../types';
import './styles/Modal.css';
import './styles/WorkSessionManager.css';

export function WorkSessionManager() {
  const { 
    isWorkSessionManagerOpen,
    setIsWorkSessionManagerOpen,
    words,
    settings,
    setSettings,
    activeTimerWordId,
    handleStartSession,
    handleNextTask,
    handlePreviousTask,
    handleStartTaskFromSession,
  } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return words.filter(word => 
      word.text.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(settings.workSessionQueue || []).includes(word.id) // Don't show tasks already in the queue
    );
  }, [searchQuery, words, settings.workSessionQueue]);

  if (!isWorkSessionManagerOpen) {
    return null;
  }

  const workSessionQueue = settings.workSessionQueue || [];
  const currentIndex = activeTimerWordId !== null ? workSessionQueue.indexOf(activeTimerWordId) : -1;
  const canGoNext = workSessionQueue.length > 0 && currentIndex < workSessionQueue.length - 1;
  const canGoPrevious = currentIndex > 0;

  const handleAddTask = (wordId: number) => {
    setSettings(prev => ({
      ...prev,
      workSessionQueue: [...(prev.workSessionQueue || []), wordId]
    }));
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleRemoveTask = (wordId: number) => {
    setSettings(prev => ({ ...prev, workSessionQueue: (prev.workSessionQueue || []).filter(id => id !== wordId) }));
  };

  return (
    <div className="modal-overlay" onClick={() => setIsWorkSessionManagerOpen(false)}>
      <div className="modal-content work-session-manager" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4>Work Session Manager</h4>
          <div className="modal-header-actions">
            <button 
              onClick={handleStartSession} 
              className="icon-button" 
              title="Start Session"
              disabled={workSessionQueue.length === 0}>
              <i className="fas fa-play"></i>
            </button>
            <button
              onClick={handlePreviousTask}
              className="icon-button"
              title="Previous Task in Session"
              disabled={!canGoPrevious}>
              <i className="fas fa-step-backward"></i>
            </button>
            <button
              onClick={handleNextTask}
              className="icon-button"
              title="Next Task in Session"
              disabled={!canGoNext}>
              <i className="fas fa-step-forward"></i>
            </button>
          </div>
          <button onClick={() => setIsWorkSessionManagerOpen(false)} className="icon-button">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="work-session-shuttle">
            <div className="work-session-panel">
              <h5>Available Tasks</h5>
              <div className="work-session-search">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search to add a task..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <ul className="work-session-list">
                {searchResults.slice(0, 20).map(task => {
                  let checklistProgress: string | null = null;
                  if (task.checklist && task.checklist.length > 0) {
                    let totalItems = 0;
                    let completedItems = 0;
                    if ('items' in task.checklist[0]) { // New section-based format
                      (task.checklist as ChecklistSection[]).forEach(section => {
                        totalItems += section.items.length;
                        completedItems += section.items.filter(item => item.isCompleted).length;
                      });
                    } else { // Old flat list format
                      totalItems = task.checklist.length;
                      completedItems = (task.checklist as ChecklistItem[]).filter(item => item.isCompleted).length;
                    }
                    if (totalItems > 0) {
                      checklistProgress = `Checklist (${completedItems}/${totalItems})`;
                    }
                  }
                  return (
                    <li key={task.id} className="work-session-search-item" onClick={() => handleAddTask(task.id)} title={`Add "${task.text}" to session`}>
                      <div className="work-session-item-text-container">
                        <span className="work-session-item-title">{task.text}</span>
                        {task.timeLogTitle && <span className="work-session-item-subtitle">{task.timeLogTitle}</span>}
                        {checklistProgress && <span className="work-session-item-subtitle">{checklistProgress}</span>}
                      </div>
                      <span className="icon-button">
                        <i className="fas fa-plus"></i>
                      </span>
                    </li>
                  )})}
              </ul>
            </div>

            <div className="work-session-panel">
              <h5>Current Queue ({workSessionQueue.length})</h5>
              {workSessionQueue.length > 0 ? (
                <ul className="work-session-list">
                  {workSessionQueue.map(wordId => {
                    const task = words.find(w => w.id === wordId);
                    if (!task) return null;
                    const isActive = wordId === activeTimerWordId;
                    let checklistProgress: string | null = null;
                    if (task.checklist && task.checklist.length > 0) {
                      let totalItems = 0;
                      let completedItems = 0;
                      if ('items' in task.checklist[0]) { // New section-based format
                        (task.checklist as ChecklistSection[]).forEach(section => {
                          totalItems += section.items.length;
                          completedItems += section.items.filter(item => item.isCompleted).length;
                        });
                      } else { // Old flat list format
                        totalItems = task.checklist.length;
                        completedItems = (task.checklist as ChecklistItem[]).filter(item => item.isCompleted).length;
                      }
                      if (totalItems > 0) {
                        checklistProgress = `Checklist (${completedItems}/${totalItems})`;
                      }
                    }
                    return (
                      <li 
                        key={wordId} 
                        className={`work-session-item ${isActive ? 'active-session-item' : ''}`}
                        onDoubleClick={() => handleStartTaskFromSession(wordId)}
                      >
                        <div className="work-session-item-text-container">
                          <span className="work-session-item-title">{task.text}</span>
                          {task.timeLogTitle && <span className="work-session-item-subtitle">{task.timeLogTitle}</span>}
                          {checklistProgress && <span className="work-session-item-subtitle">{checklistProgress}</span>}
                        </div>
                        <button className="icon-button remove-btn" onClick={() => handleRemoveTask(wordId)} title="Remove from session">
                          <i className="fas fa-times"></i>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : ( <p>Your work session queue is empty. Add tasks to get started!</p> )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}