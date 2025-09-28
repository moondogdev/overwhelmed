import React from 'react';
import { formatTime } from '../utils';
import { useAppContext } from '../contexts/AppContext';

interface MiniPlayerProps {}

export const MiniPlayer: React.FC<MiniPlayerProps> = () => { 
  const {
    activeTimerWordId,
    activeTimerEntry,
    activeTimerLiveTime,
    handleGlobalToggleTimer,
    handleGlobalStopTimer,
    navigateToTask
  } = useAppContext();
  
  if (!activeTimerWordId || !activeTimerEntry) {
    return null;
  }

  return (
    <div className="mini-player">
      <div className="mini-player-info">
        <div className="mini-player-description">{activeTimerEntry.description}</div>
        <div className="mini-player-time">{formatTime(activeTimerLiveTime)}</div>
      </div>
      <div className="mini-player-controls">
        <button 
          className="icon-button" 
          title="Pause Timer" 
          onClick={() => handleGlobalToggleTimer(activeTimerWordId, activeTimerEntry.id)}
        >
          <i className="fas fa-pause"></i>
        </button>
        <button 
          className="icon-button" 
          title="Stop Timer" 
          onClick={handleGlobalStopTimer}
        >
          <i className="fas fa-stop"></i>
        </button>
        <button className="icon-button" title="Go to Task" onClick={() => navigateToTask(activeTimerWordId)}>
          <i className="fas fa-arrow-up-right-from-square"></i>
        </button>
      </div>
    </div>
  );
};