import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { formatTimestamp, formatTime } from '../utils';

export function SaveStatus() {
  const {
    settings,
    handleSaveProject,
    isDirty,
    isLoading,
    lastSaveTime,
    autoSaveCountdown
  } = useAppContext();

  return (
    <div className="clock-save-container">
      <div className="header-center-stack">
        <div className="current-browser-display">Active Browser: <b>{(settings.browsers && settings.browsers[settings.activeBrowserIndex]?.name) || 'Default'}</b></div>
      </div>
      <div className="save-status-container">
        <button
          onClick={handleSaveProject}
          onContextMenu={(e) => { e.preventDefault(); window.electronAPI.showSaveButtonContextMenu({ x: e.clientX, y: e.clientY }); }}
          className={`dynamic-save-button ${isDirty ? 'unsaved' : 'saved'}`}
          disabled={isLoading}
        >
          {isDirty ? 'Save Project (Unsaved)' : 'Project Saved'}
        </button>
        {lastSaveTime && <div className="save-timestamp">Last saved at {formatTimestamp(lastSaveTime)}</div>}
        {isDirty && <div className="save-timestamp">
          Autosaving in: {formatTime(autoSaveCountdown * 1000)}
        </div>}
      </div>
    </div>
  );
}