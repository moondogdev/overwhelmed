import React from 'react';
import { Word, Settings, ChecklistItem, ChecklistSection } from '../types';
import { formatTimestampForInput, parseInputTimestamp } from '../utils';
import { CategoryOptions } from './TaskView';
import { Checklist } from './Checklist';
import { DescriptionEditor } from './Editors';
import { useAppContext } from '../contexts/AppContext';
import { SimpleAccordion } from './SidebarComponents';

export function AddNewTaskForm() {
  const {
    newTask, setNewTask, settings, setSettings, words, setInboxMessages,
    handleChecklistCompletion, activeChecklistRef, showToast, focusChecklistItemId,
    setFocusChecklistItemId, handleGlobalToggleTimer, handleCreateNewTask, handleClearActiveTimer, handlePrimeTask, handlePrimeTaskWithNewLog, activeTimerEntry, activeTimerLiveTime,
    newTaskTitleInputRef, isAddTaskOpen, setIsAddTaskOpen,
  } = useAppContext();

  const selectedTaskType = (settings.taskTypes || []).find(type => type.id === newTask.taskType);
  const visibleFields = selectedTaskType ? selectedTaskType.fields : [];

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleCreateNewTask();
    }
  };

  const shouldShow = (fieldName: keyof Word) => visibleFields.includes(fieldName);

  return (
    <SimpleAccordion title="Add New Task" startOpen={isAddTaskOpen} onToggle={setIsAddTaskOpen}>
      <label><h4>Task Type:</h4>
        <select value={newTask.taskType} onChange={(e) => setNewTask({ ...newTask, taskType: e.target.value })}>
          {(settings.taskTypes || []).map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
      </label>
      {shouldShow('text') && <label><h4>Task Title:</h4><input ref={newTaskTitleInputRef} type="text" placeholder="Enter a title and press Enter" value={newTask.text} onChange={(e) => setNewTask({ ...newTask, text: e.target.value })} onKeyDown={handleInputKeyDown} /></label>}
      {shouldShow('url') && <label><h4>URL:</h4><input type="text" placeholder="https://example.com" value={newTask.url} onChange={(e) => setNewTask({ ...newTask, url: e.target.value })} /></label>}
      {shouldShow('categoryId') && <label><h4>Category:</h4>
        <select value={newTask.categoryId} onChange={(e) => setNewTask({ ...newTask, categoryId: Number(e.target.value) })}>
          <CategoryOptions categories={settings.categories} />
        </select>
      </label>}
      {shouldShow('priority') && <label><h4>Priority:</h4>
        <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </label>}
      {shouldShow('openDate') && <label><h4>Open Date:</h4>
        <div className="date-input-group">
          <input type="datetime-local" value={formatTimestampForInput(newTask.openDate)} onChange={(e) => setNewTask({ ...newTask, openDate: parseInputTimestamp(e.target.value) })} />
          <div className="button-group">{(() => {
            const subtractTime = (amount: number, unit: 'minutes' | 'hours' | 'days') => {
              const baseTime = newTask.openDate ? new Date(newTask.openDate) : new Date();
              if (unit === 'minutes') baseTime.setMinutes(baseTime.getMinutes() - amount);
              if (unit === 'hours') baseTime.setHours(baseTime.getHours() - amount);
              if (unit === 'days') baseTime.setDate(baseTime.getDate() - amount);
              setNewTask({ ...newTask, openDate: baseTime.getTime() });
            };
            return <><button className="icon-button" onClick={() => setNewTask({ ...newTask, openDate: undefined })} title="Clear Date"><i className="fas fa-times"></i></button>
              <button onClick={() => setNewTask({ ...newTask, openDate: new Date().getTime() })} title="Set to Now">NOW</button>
              <button onClick={() => { const d = new Date(newTask.openDate || Date.now()); d.setMinutes(0, 0, 0); setNewTask({ ...newTask, openDate: d.getTime() }); }} title="Round to Hour">:00</button>
              <button onClick={() => subtractTime(15, 'minutes')}>-15m</button> <button onClick={() => subtractTime(30, 'minutes')}>-30m</button>
              <button onClick={() => subtractTime(1, 'hours')}>-1h</button> <button onClick={() => subtractTime(2, 'hours')}>-2h</button>
              <button onClick={() => subtractTime(1, 'days')}>-1d</button> <button onClick={() => subtractTime(3, 'days')}>-3d</button>
            </>;
          })()}
          </div>
        </div>
      </label>}
      {shouldShow('completeBy') && <label><h4>Complete By:</h4>
        <input type="datetime-local" value={formatTimestampForInput(newTask.completeBy)} onChange={(e) => setNewTask({ ...newTask, completeBy: parseInputTimestamp(e.target.value) })} />
        <div className="button-group">{(() => {
          const addTime = (amount: number, unit: 'minutes' | 'hours' | 'days') => {
            const baseTime = newTask.completeBy ? new Date(newTask.completeBy) : new Date();
            if (unit === 'minutes') baseTime.setMinutes(baseTime.getMinutes() + amount);
            if (unit === 'hours') baseTime.setHours(baseTime.getHours() + amount);
            if (unit === 'days') baseTime.setDate(baseTime.getDate() + amount);
            setNewTask({ ...newTask, completeBy: baseTime.getTime() });
          };
          return <><button className="icon-button" onClick={() => setNewTask({ ...newTask, completeBy: undefined })} title="Clear Date"><i className="fas fa-times"></i></button>
            <button onClick={() => setNewTask({ ...newTask, completeBy: new Date().getTime() })} title="Set to Now">NOW</button>
            <button onClick={() => {
              const baseTime = newTask.completeBy ? new Date(newTask.completeBy) : new Date();
              baseTime.setMinutes(0, 0, 0); // Set minutes, seconds, and ms to 0
              setNewTask({ ...newTask, completeBy: baseTime.getTime() });
            }} title="Round to Hour">:00</button>
            <button onClick={() => addTime(15, 'minutes')}>+15m</button> <button onClick={() => addTime(30, 'minutes')}>+30m</button>
            <button onClick={() => addTime(1, 'hours')}>+1h</button> <button onClick={() => addTime(2, 'hours')}>+2h</button>
            <button onClick={() => addTime(1, 'days')}>+1d</button> <button onClick={() => addTime(3, 'days')}>+3d</button>
          </>;
        })()}</div>
      </label>}
      {shouldShow('company') && <label><h4>Company:</h4><input type="text" value={newTask.company} onChange={(e) => setNewTask({ ...newTask, company: e.target.value })} /></label>}
      {shouldShow('payRate') && <label><h4>Pay Rate ($/hr):</h4><input type="number" value={newTask.payRate || 0} onChange={(e) => setNewTask({ ...newTask, payRate: Number(e.target.value) })} /></label>}
      {shouldShow('websiteUrl') && <label><h4>Website URL:</h4><input type="text" placeholder="https://company.com" value={newTask.websiteUrl} onChange={(e) => setNewTask({ ...newTask, websiteUrl: e.target.value })} /></label>}
      {shouldShow('imageLinks') && <label><h4>Image Links:</h4>
        {(newTask.imageLinks || []).map((link, index) => (
          <div key={index} className="image-link-edit">
            <input type="text" value={link} onChange={(e) => {
              const newLinks = [...(newTask.imageLinks || [])];
              newLinks[index] = e.target.value;
              setNewTask({ ...newTask, imageLinks: newLinks });
            }} /><button className="icon-button" onClick={() => setNewTask({ ...newTask, imageLinks: (newTask.imageLinks || []).filter((_, i) => i !== index) })}><i className="fas fa-minus"></i></button>
          </div>
        ))}
        <button className="add-link-btn" onClick={() => setNewTask({ ...newTask, imageLinks: [...(newTask.imageLinks || []), ''] })}>
          <i className="fas fa-plus"></i> Add Image Link
        </button>
      </label>}
      {shouldShow('checklist') && <Checklist
        sections={newTask.checklist || []}
        onUpdate={(newSections) => setNewTask({ ...newTask, checklist: newSections })}
        onComplete={handleChecklistCompletion}
        isEditable={true}
        onWordUpdate={(updatedWord) => setNewTask(updatedWord)}
        word={newTask as Word}
        words={words}
        setInboxMessages={setInboxMessages}
        checklistRef={activeChecklistRef}
        wordId={Date.now()} // Use a temporary ID for the new task context
        showToast={showToast}
        focusItemId={focusChecklistItemId}
        onFocusHandled={() => setFocusChecklistItemId(null)}
        settings={settings}
        handleGlobalToggleTimer={handleGlobalToggleTimer}
        handlePrimeTask={handlePrimeTask}
        handlePrimeTaskWithNewLog={handlePrimeTaskWithNewLog}
        activeTimerEntry={activeTimerEntry}
        activeTimerLiveTime={activeTimerLiveTime}
        handleClearActiveTimer={handleClearActiveTimer}
        onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
      />}
      {shouldShow('description') && <DescriptionEditor
        description={newTask.description || ''}
        onDescriptionChange={(html) => setNewTask({ ...newTask, description: html })}
        settings={settings}
        onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
        editorKey="new-task-description"
      />}
      {shouldShow('attachments') && <div className="description-container">
        <strong>Attachments:</strong>
        {(newTask.attachments || []).map((file, index) => (
          <div key={index} className="attachment-edit">
            <span className="attachment-name" title={file.path}>📄 {file.name}</span><button className="icon-button" onClick={() => setNewTask({ ...newTask, attachments: (newTask.attachments || []).filter((_, i) => i !== index) })}><i className="fas fa-minus"></i></button>
          </div>
        ))}
        <button className="add-link-btn" onClick={async () => {
          const newFile = await window.electronAPI.manageFile({ action: 'select' });
          if (newFile) {
            setNewTask({ ...newTask, attachments: [...(newTask.attachments || []), newFile] });
          }
        }}><i className="fas fa-plus"></i> Attach File</button>
      </div>}
      {shouldShow('notes') && <div className="description-container">
        <strong>Notes:</strong>
        <DescriptionEditor
          description={newTask.notes || ''}
          onDescriptionChange={(html) => setNewTask({ ...newTask, notes: html })}
          settings={settings}
          onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
          editorKey="new-task-notes" />
      </div>}
      {shouldShow('isRecurring') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isRecurring || false} onChange={(e) => setNewTask({ ...newTask, isRecurring: e.target.checked })} /><span className='checkbox-label-text'>Re-occurring Task</span></label>}
      {shouldShow('isDailyRecurring') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isDailyRecurring || false} onChange={(e) => setNewTask({ ...newTask, isDailyRecurring: e.target.checked })} /><span className='checkbox-label-text'>Repeat Daily</span></label>}
      {shouldShow('isWeeklyRecurring') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isWeeklyRecurring || false} onChange={(e) => setNewTask({ ...newTask, isWeeklyRecurring: e.target.checked })} /><span className='checkbox-label-text'>Repeat Weekly</span></label>}
      {shouldShow('isMonthlyRecurring') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isMonthlyRecurring || false} onChange={(e) => setNewTask({ ...newTask, isMonthlyRecurring: e.target.checked })} /><span className='checkbox-label-text'>Repeat Monthly</span></label>}
      {shouldShow('isYearlyRecurring') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isYearlyRecurring || false} onChange={(e) => setNewTask({ ...newTask, isYearlyRecurring: e.target.checked })} /><span className='checkbox-label-text'>Repeat Yearly</span></label>}
      {shouldShow('isAutocomplete') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isAutocomplete || false} onChange={(e) => setNewTask({ ...newTask, isAutocomplete: e.target.checked })} /><span className='checkbox-label-text'>Autocomplete on Deadline</span></label>}
      <button onClick={() => handleCreateNewTask()}>
        <i className="fas fa-plus"></i> Add Task
      </button>
    </SimpleAccordion>
  );
}