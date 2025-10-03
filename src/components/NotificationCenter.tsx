import React, { useState, useMemo } from 'react';
import { Task, Settings } from '../types';
import { formatTimestamp } from '../utils';
import { TimeLeft } from './TaskComponents';
import { useAppContext } from '../contexts/AppContext';
import './styles/Notifications.css';

interface NotificationCenterProps {}

export function NotificationCenter({}: NotificationCenterProps) {
  const {
    toastMessage, timerNotifications, overdueNotifications, tasks, settings, setSettings,
    snoozeTimeSelectRef, handleSnoozeAll, handleUnSnooze, handleUnSnoozeAll, handleSilenceTask, 
    handleUnsilenceTask, handleCompleteAllOverdue, handleSkipAllOverdue, handleDismissAllOverdue, handleDeleteAllOverdue,
    navigateToTask, handleSnooze, handleCompleteTask, removeTask, setTasks, handleTimerNotify,
  } = useAppContext();

  const [isSnoozedVisible, setIsSnoozedVisible] = useState(false);
  const [isSilencedVisible, setIsSilencedVisible] = useState(false);

  const handleInboxItemClick = (message: { taskId: number }) => {
    navigateToTask(message.taskId);
  };

  const snoozedTasks = useMemo(() => {
    const now = Date.now();
    return tasks.filter(task => 
      task.completeBy && 
      task.completeBy < now && // It's overdue
      task.lastNotified && 
      task.lastNotified > now && // It's snoozed
      !overdueNotifications.has(task.id) // It's not currently showing an overdue toast
    );
  }, [tasks, overdueNotifications]);

  const silencedTasks = useMemo(() => {
    const now = Date.now();
    return tasks.filter(task => 
      task.isSilenced &&
      task.completeBy && 
      task.completeBy < now // It's overdue
    );
  }, [tasks]);

  return (
    <>
      {toastMessage && <div className="copy-status-toast toast-notification-central">{toastMessage}</div>}
      
      {timerNotifications.length > 0 && (
        <div className="timer-notification-container">
          {timerNotifications.map(task => (
            <div key={task.id} className="timer-notification-toast">
              <span className="toast-icon">⏳</span>
              <div>
                <strong>Timer Alert:</strong> {task.text}
                <br />
                <TimeLeft task={task} onUpdate={() => {}} onNotify={() => {}} settings={settings} /> remaining.
              </div>
            </div>
          ))}
        </div>
      )}
      
      {(overdueNotifications.size > 0 || snoozedTasks.length > 0 || silencedTasks.length > 0) && (
        <div className="overdue-notification-container">
          <div className="overdue-notification-summary">
            <span>Overdue: {overdueNotifications.size + snoozedTasks.length + silencedTasks.length}</span>
            {snoozedTasks.length > 0 && (
              <div className="reveal-snoozed-container">
                <button className="reveal-snoozed-btn" onClick={() => setIsSnoozedVisible(!isSnoozedVisible)}>
                  Snoozed: {snoozedTasks.length} <i className={`fas ${isSnoozedVisible ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                </button>
                <button className="icon-button" onClick={handleUnSnoozeAll} title="Un-snooze All"><i className="fas fa-bell"></i></button>
              </div>
            )}
            {silencedTasks.length > 0 && (
              <button className="reveal-snoozed-btn" onClick={() => setIsSilencedVisible(!isSilencedVisible)}>
                Dismissed: {silencedTasks.length} <i className={`fas ${isSilencedVisible ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </button>
            )}
            {overdueNotifications.size > 1 && (
              <div className="overdue-summary-actions">
                <button className="icon-button" onClick={() => handleSnoozeAll()} title="Snooze All"><i className="fas fa-bell-slash"></i></button> {/* Snooze */}
                <button className="icon-button" onClick={() => handleSnoozeAll('high')} title="Snooze All for 10 minutes"><i className="fas fa-hourglass-half"></i></button> {/* Snooze 10m */}
                <button className="icon-button" onClick={() => handleSnoozeAll('long')} title="Snooze All for 1 hour"><i className="fas fa-hourglass"></i></button> {/* Snooze 1hr */}
                <button className="icon-button" onClick={handleSkipAllOverdue} title="Skip All Overdue"><i className="fas fa-forward"></i></button> {/* Skip */}
                <button className="icon-button" onClick={handleDismissAllOverdue} title="Dismiss All Overdue"><i className="fas fa-eye-slash"></i></button> {/* Dismiss */}
                <button className="icon-button" onClick={handleCompleteAllOverdue} title="Complete All Overdue"><i className="fas fa-check-double"></i></button> {/* Complete */}
                <button className="icon-button" onClick={handleDeleteAllOverdue} title="Delete All Overdue"><i className="fas fa-trash-alt"></i></button> {/* Delete */}
              </div>
            )}
          </div>
          {isSnoozedVisible && snoozedTasks.length > 0 && (
            <div className="snoozed-tasks-list">
              {snoozedTasks.map(task => (
                <div key={task.id} className="snoozed-task-item">
                  <span className="snoozed-task-name">{task.text}</span>
                  <span className="snoozed-task-until">
                    Snoozed until: {formatTimestamp(task.lastNotified || 0)}
                  </span>
                  <div className="snoozed-task-actions">
                    <button onClick={() => handleUnSnooze(task.id)} title="Un-snooze this task">
                      <i className="fas fa-bell"></i> Un-snooze
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isSilencedVisible && silencedTasks.length > 0 && (
            <div className="snoozed-tasks-list">
              {silencedTasks.map(task => (
                <div key={task.id} className="snoozed-task-item">
                  <span className="snoozed-task-name">{task.text}</span>
                  <span className="snoozed-task-until">
                    Dismissed
                  </span>
                  <div className="snoozed-task-actions">
                    <button onClick={() => handleUnsilenceTask(task.id)} title="Un-silence this task">
                      <i className="fas fa-bell"></i> Un-silence
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="overdue-notification-list">
            {Array.from(overdueNotifications).map(taskId => {
              const task = tasks.find(t => t.id === taskId);
              if (!task) return null;
              return (
                <div
                  key={task.id}
                  className="overdue-notification-toast"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const isInEditMode = settings.activeTaskTabs?.[task.id] === 'edit';
                    window.electronAPI.showToastContextMenu({ taskId: task.id, x: e.clientX, y: e.clientY, isInEditMode });
                  }}
                >
                  <div className="overdue-notification-content">
                    <div className="overdue-title-bar">
                      <span
                        className="clickable"
                        onClick={() => handleInboxItemClick({ taskId: task.id })}
                        title="Go to task">
                        <span className="toast-icon">🚨</span>
                        <strong>{task.text}</strong> is Due!
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
                    <div className="overdue-timer clickable" onClick={() => handleInboxItemClick({ taskId: task.id })} title="Go to task">
                      <TimeLeft task={task} onUpdate={(updatedTask) => setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))} onNotify={handleTimerNotify} settings={settings} />
                    </div>
                    <div className="overdue-inbox-link">
                      Notification sent to <a href="#" onClick={(e) => { e.preventDefault(); setSettings(prev => ({...prev, currentView: 'inbox'})); }}>Inbox</a>
                    </div>
                    <div className="overdue-notification-actions">
                      <button className="icon-button" onClick={() => handleSnooze(task)} title={`Snooze for ${settings.snoozeTime === 'low' ? '1' : settings.snoozeTime === 'medium' ? '5' : '10'} minutes`}><i className="fas fa-bell-slash"></i></button>
                      <button className="icon-button" onClick={() => handleSnooze(task, 'high')} title="Snooze for 10 minutes"><i className="fas fa-hourglass-half"></i></button>
                      <button className="icon-button" onClick={() => handleSnooze(task, 'long')} title="Snooze for 1 hour"><i className="fas fa-hourglass"></i></button>
                      <button className="icon-button" onClick={() => handleCompleteTask(task, 'skipped')} title="Skip this task"><i className="fas fa-forward"></i></button>
                      <button className="icon-button" onClick={() => handleSilenceTask(task.id)} title="Dismiss this alert until app restart"><i className="fas fa-eye-slash"></i></button>
                      <button className="icon-button" onClick={() => handleCompleteTask(task, 'completed')} title="Complete this task"><i className="fas fa-check"></i></button>
                      <button className="icon-button" onClick={() => removeTask(task.id)} title="Delete this task"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}