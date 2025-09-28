import React from 'react';
import { Word, Settings } from '../types';
import { TimeLeft } from './TaskComponents';
import { useAppContext } from '../contexts/AppContext';

interface OverdueNoticeProps {}

export function OverdueNotice({}: OverdueNoticeProps) {
  const {
    overdueNotifications, words, settings, setSettings, snoozeTimeSelectRef, handleSnoozeAll,
    handleCompleteAllOverdue, handleDeleteAllOverdue, navigateToTask, handleSnooze,
    handleCompleteWord, removeWord, setWords, handleTimerNotify
  } = useAppContext();

  const handleInboxItemClick = (message: { wordId: number }) => {
    navigateToTask(message.wordId);
  };

  if (overdueNotifications.size === 0) {
    return null;
  }

  return (
    <div className="overdue-notification-container">
      <div className="overdue-notification-summary">
        Overdue: {overdueNotifications.size}
        {overdueNotifications.size > 1 && (
          <div className="overdue-summary-actions">
            <button onClick={() => handleSnoozeAll()}>Snooze All</button>
            <button onClick={() => handleSnoozeAll('high')}>Snooze All 10m</button>
            <button onClick={handleCompleteAllOverdue}>Complete All</button>
            <button onClick={handleDeleteAllOverdue}>Delete All</button>
          </div>
        )}
      </div>
      <div className="overdue-notification-list">
        {Array.from(overdueNotifications).map(wordId => {
          const word = words.find(w => w.id === wordId);
          if (!word) return null;
          return (
            <div
              key={word.id}
              className="overdue-notification-toast"
              onContextMenu={(e) => {
                e.preventDefault();
                const isInEditMode = settings.activeTaskTabs?.[word.id] === 'edit';
                window.electronAPI.showToastContextMenu({ wordId: word.id, x: e.clientX, y: e.clientY, isInEditMode });
              }}
            >
              <div className="overdue-notification-content">
                <div className="overdue-title-bar">
                  <span
                    className="clickable"
                    onClick={() => handleInboxItemClick({ wordId: word.id })}
                    title="Go to task">
                    <span className="toast-icon">🚨</span>
                    <strong>{word.text}</strong> is Due!
                  </span><button className="icon-button overdue-settings-btn" title="Edit Notification Settings" onClick={() => {
                    const timeManagementAccordionId = -2;
                    setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, timeManagementAccordionId])] }));
                    setTimeout(() => {
                      snoozeTimeSelectRef.current?.focus();
                      snoozeTimeSelectRef.current?.classList.add('highlight-setting');
                      setTimeout(() => snoozeTimeSelectRef.current?.classList.remove('highlight-setting'), 2000);
                    }, 100);;
                  }}><i className="fas fa-cog"></i></button>
                </div>
                <div className="overdue-timer clickable" onClick={() => handleInboxItemClick({ wordId: word.id })} title="Go to task">
                  <TimeLeft word={word} onUpdate={(updatedWord) => setWords(words.map(w => w.id === updatedWord.id ? updatedWord : w))} onNotify={handleTimerNotify} settings={settings} />
                </div>
                <div className="overdue-inbox-link">
                  Notification sent to <a href="#" onClick={(e) => { e.preventDefault(); setSettings(prev => ({...prev, currentView: 'inbox'})); }}>Inbox</a>
                </div>
                <div className="overdue-notification-actions">
                  <button onClick={() => handleSnooze(word)} title={`Snooze for ${settings.snoozeTime === 'low' ? '1' : settings.snoozeTime === 'medium' ? '5' : '10'} minutes`}>Snooze</button>
                  <button onClick={() => handleSnooze(word, 'high')} title="Snooze for 10 minutes">Snooze 10m</button>
                  <button onClick={() => handleCompleteWord(word)} title="Complete this task">Complete</button>
                  <button onClick={() => removeWord(word.id)} title="Delete this task">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}