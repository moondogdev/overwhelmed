import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Settings, InboxMessage, ChecklistItem, ChecklistSection, TimeLogEntry, Attachment, Category } from '../types';
import { formatTimestampForInput, parseInputTimestamp, formatTimestamp } from '../utils';
import { TimeTrackerLog } from './TimeTrackerLog';
import { DescriptionEditor } from './Editors';
import './styles/TaskView.css';
import { Checklist } from './Checklist';
import { useAppContext } from '../contexts/AppContext';
import { TimeLeft, TimeOpen } from './TaskComponents';

export interface FullTaskViewProps {
    task: Task;
    onClose: () => void;    
    onUpdate: (updatedTask: Task) => void;    
}

export function CategoryOptions({ categories }: { categories: Category[] }) {
    const parentCategories = categories.filter(c => !c.parentId);

    return (
        <>
            {parentCategories.map(parent => {
                const children = categories.filter(sub => sub.parentId === parent.id);
                return (
                    <React.Fragment key={parent.id}>
                        <option value={parent.id}>{parent.name}</option>
                        {children.map(child => <option key={child.id} value={child.id}>&nbsp;&nbsp;{child.name}</option>)}
                    </React.Fragment>
                )
            })}
        </>
    );
}

export function ActiveFullTaskView({
  fullTaskViewId,
  tasks,
  completedTasks,
  onClose, onUpdate, onSettingsChange
}: Omit<FullTaskViewProps, 'task'> & { fullTaskViewId: number | null; tasks: Task[]; completedTasks: Task[], onClose: () => void, onUpdate: (updatedTask: Task) => void, onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void }) {
  const taskToShow = useMemo(() => {
    if (!fullTaskViewId) return null;
    return tasks.find(t => t.id === fullTaskViewId) || completedTasks.find(t => t.id === fullTaskViewId);
  }, [fullTaskViewId, tasks, completedTasks]);

  if (!fullTaskViewId || !taskToShow) {
    return null;
  }

  return (
    <FullTaskView
      task={taskToShow}
      onClose={onClose}
      onUpdate={onUpdate}
      onSettingsChange={onSettingsChange} // Pass it down
    />
  );
}

export function FullTaskView({ task, onClose, onUpdate, onSettingsChange }: FullTaskViewProps & { onSettingsChange?: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void }) {
    const { setSettings } = useAppContext();

    return (
        <div className="full-task-view-container">
            <div className="full-task-view-header">
                <button onClick={onClose} className="back-to-list-btn">
                    <i className="fas fa-arrow-left"></i>
                    Back to List
                </button>
            </div>
            <div className="full-task-view-content">
                <TabbedView task={task} onUpdate={onUpdate} onSettingsChange={onSettingsChange || setSettings} />
            </div>
        </div>
    );
}

export function TabbedView({
    task, onUpdate, onSettingsChange
}: { task: Task, onUpdate: (updatedTask: Task) => void, onSettingsChange?: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void }) {
    const {
        settings, setSettings, tasks, completedTasks, setInboxMessages, showToast,
        handleChecklistCompletion, activeChecklistRef, focusChecklistItemId, setFocusChecklistItemId,
        handleGlobalToggleTimer, activeTimerTaskId, activeTimerEntry, activeTimerLiveTime, handleGlobalResetTimer, handleClearActiveTimer, handleGlobalStopTimer, handlePrimeTask, handlePrimeTaskWithNewLog, handlePostAndComplete,
        handlePostLog, handlePostAndResetLog, handleResetAllLogEntries,
        handleTimerNotify, handleNextEntry, handlePreviousEntry
    } = useAppContext();

    const initialTab = settings.activeTaskTabs[task.id] || (task.completedDuration ? 'ticket' : 'ticket');
    const [activeTab, setActiveTab] = useState<'ticket' | 'edit'>(initialTab);
    // This effect synchronizes the internal state with the prop from the parent.
    useEffect(() => {
        // This effect is now only for synchronizing with settings, not startInEditMode
        const newTab = settings.activeTaskTabs[task.id] || 'ticket';
        if (newTab !== activeTab) setActiveTab(newTab);
    }, [settings.activeTaskTabs, task.id, activeTab]);

    const handleTabClick = (tab: 'ticket' | 'edit') => {
        setActiveTab(tab);
        setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [task.id]: tab } }));
    };

    const handleFieldChange = (field: keyof Task, value: any) => {
        onUpdate({ ...task, [field]: value });
    };

    const handleTaskContextMenu = (e: React.MouseEvent) => {
        e.stopPropagation(); // CRITICAL: Stop the event from bubbling up to the global listener.
        const isInEditMode = activeTab === 'edit';
        const hasCompletedTasks = completedTasks.length > 0;
        window.electronAPI.showTaskContextMenu({ taskId: task.id, x: e.clientX, y: e.clientY, isInEditMode, hasCompletedTasks });
    };

    // Hooks must be called at the top level, not inside conditionals.
    const descriptionRef = useRef<HTMLDivElement>(null);
    const notesRef = useRef<HTMLDivElement>(null);
    const handleCopyDescription = async () => {
        if (descriptionRef.current) {
            try {
                // Request permission to write to the clipboard
                await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
                const html = descriptionRef.current.innerHTML;
                const text = descriptionRef.current.innerText;
                const htmlBlob = new Blob([html], { type: 'text/html' });
                const textBlob = new Blob([text], { type: 'text/plain' });
                const data = [new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })];
                await navigator.clipboard.write(data);
                showToast('Description copied!');
            } catch (err) {
                console.error('Failed to copy description: ', err);
                showToast('Copy failed!');
            }
        }
    };

    const handleCopyNotes = async () => {
        if (notesRef.current) {
            try {
                await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
                // The notes are inside a DescriptionEditor, which has a content-editable div.
                // We need to find that div to get its innerHTML and innerText.
                const editorDiv = notesRef.current.querySelector('.rich-text-editor');
                if (editorDiv) {
                    const html = editorDiv.innerHTML;
                    const text = (editorDiv as HTMLElement).innerText;
                    const htmlBlob = new Blob([html], { type: 'text/html' });
                    const textBlob = new Blob([text], { type: 'text/plain' });
                    const data = [new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })];
                    await navigator.clipboard.write(data);
                    showToast('Notes copied!');
                }
            } catch (err) {
                console.error('Failed to copy notes: ', err);
                showToast('Copy failed!');
            }
        }
    };

    const handleCopyAll = async () => {
        if (descriptionRef.current && notesRef.current) {
            try {
                await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
                const descriptionHtml = `<h3>Description</h3>${descriptionRef.current.innerHTML}`;
                const editorDiv = notesRef.current.querySelector('.rich-text-editor');
                const notesHtml = editorDiv ? `<h3>Notes</h3>${editorDiv.innerHTML}` : '';
                const combinedHtml = `${descriptionHtml}<hr>${notesHtml}`;

                const descriptionText = `Description\n${descriptionRef.current.innerText}`;
                const notesText = editorDiv ? `\n\nNotes\n${(editorDiv as HTMLElement).innerText}` : '';
                const combinedText = `${descriptionText}${notesText}`;

                const htmlBlob = new Blob([combinedHtml], { type: 'text/html' });
                const textBlob = new Blob([combinedText], { type: 'text/plain' });
                const data = [new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })];
                await navigator.clipboard.write(data);
                showToast('All content copied!');
            } catch (err) {
                console.error('Failed to copy all: ', err);
                showToast('Copy failed!');
            }
        }
    };

    const tabContentRef = useRef<HTMLDivElement>(null);

    const tabHeaders = (
        <div className="tab-headers" style={{ marginTop: '5px' }}>
            <button onClick={() => handleTabClick('ticket')} className={activeTab === 'ticket' ? 'active' : ''}>Task</button>
            {!task.completedDuration && ( // Only show Edit tab for non-completed items
                <button onClick={() => handleTabClick('edit')} className={activeTab === 'edit' ? 'active' : ''}>Edit</button>
            )}
        </div>
    );

    return (
        <div className="tab-container">
            {tabHeaders}
            <div className="tab-content" ref={tabContentRef}>
                {activeTab === 'ticket' && (
                    <div className="ticket-display-view">
                        <h3 onContextMenu={handleTaskContextMenu}>{task.text} (ID: {task.id})</h3>
                        {task.url && <p><strong>URL:</strong> <span className="link-with-copy"><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI.openExternalLink({ url: task.url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path }); }}>{task.url}</a><button className="icon-button copy-btn" title="Copy URL" onClick={() => { navigator.clipboard.writeText(task.url); showToast('URL copied!'); }}><i className="fas fa-copy"></i></button></span></p>}
                        <p><strong>Category:</strong> {settings.categories.find(c => c.id === task.categoryId)?.name || 'Uncategorized'}</p>
                        <p><strong>Priority:</strong> {task.priority || 'Medium'}</p>
                        <p><strong>Open Date:</strong> {formatTimestamp(task.openDate)}</p>
                        <p><strong>Time Open:</strong> <TimeOpen startDate={task.createdAt} /></p>
                        {task.completeBy && <p><strong>Complete By:</strong> {formatTimestamp(task.completeBy)}</p>}
                        {task.completeBy && <p><strong>Time Left:</strong> <TimeLeft task={task} onUpdate={onUpdate} onNotify={handleTimerNotify} settings={settings} /></p>}
                        {task.company && <p><strong>Company:</strong> <span className="link-with-copy">{task.company}<button className="icon-button copy-btn" title="Copy Company" onClick={() => { navigator.clipboard.writeText(task.company); showToast('Company copied!'); }}><i className="fas fa-copy"></i></button></span></p>}
                        <div className="work-timer-container"><strong>Work Timer:</strong>
                            <TimeTrackerLog
                                task={task}
                                onUpdate={onUpdate}
                                showToast={showToast}
                                handleGlobalToggleTimer={handleGlobalToggleTimer}
                                activeTimerTaskId={activeTimerTaskId}
                                activeTimerEntry={activeTimerEntry}
                                activeTimerLiveTime={activeTimerLiveTime}                                
                                handleClearActiveTimer={handleClearActiveTimer}
                                handleGlobalResetTimer={handleGlobalResetTimer}
                                handleGlobalStopTimer={handleGlobalStopTimer} // This was missing
                                handleNextEntry={handleNextEntry}
                                handlePreviousEntry={handlePreviousEntry}
                                handlePostLog={handlePostLog}
                                handlePostAndResetLog={handlePostAndResetLog}
                                handleResetAllLogEntries={handleResetAllLogEntries}
                                handlePostAndComplete={handlePostAndComplete}
                                settings={settings}
                                checklistRef={activeChecklistRef}
                            />
                        </div>
                        <div><strong>Task Cost:</strong>
                            <span> ${(((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)).toFixed(2)}</span>
                        </div>
                        {task.websiteUrl && <p><strong>Website URL:</strong> <span className="link-with-copy"><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI.openExternalLink({ url: task.websiteUrl, browserPath: settings.browsers[settings.activeBrowserIndex]?.path }); }}>{task.websiteUrl}</a><button className="icon-button copy-btn" title="Copy URL" onClick={() => { navigator.clipboard.writeText(task.websiteUrl); showToast('Website URL copied!'); }}><i className="fas fa-copy"></i></button></span></p>}
                        <div><strong>Image Links:</strong>
                            <div className="image-links-display">
                                {(task.imageLinks || []).map((link, index) => (
                                    <div key={index} className="image-link-item">
                                        <img src={link} alt={`Image ${index + 1}`} />
                                        <div className="image-link-actions">
                                            <button className="icon-button" onClick={() => window.electronAPI.downloadImage(link)} title="Download Image"><i className="fas fa-download"></i></button>
                                            <button className="icon-button" onClick={() => { navigator.clipboard.writeText(link); showToast('Image URL copied!'); }} title="Copy URL"><i className="fas fa-copy"></i></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div><strong>Attachments:</strong>
                            <div className="attachments-display">
                                {(task.attachments || []).map((file, index) => (
                                    <div key={index} className="attachment-item">
                                        <span className="attachment-name" onClick={() => window.electronAPI.manageFile({ action: 'open', filePath: file.path })} title={`Open ${file.name}`}>
                                            📄 {file.name}
                                        </span>
                                        {/* The remove button is only shown in the edit view for clarity */}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {tabHeaders}
                        <div className="description-container" onContextMenu={(e) => {
                            const selection = window.getSelection();
                            const selectedText = selection?.toString().trim();
                            const target = e.target as HTMLElement;

                            // Priority 1: A link is right-clicked. Show the link menu.
                            if (target.tagName === 'A') {
                                e.preventDefault();                                
                                e.stopPropagation();
                                const url = target.getAttribute('href');
                                if (url) window.electronAPI.send('show-link-context-menu', { url, x: e.clientX, y: e.clientY, browsers: settings.browsers, activeBrowserIndex: settings.activeBrowserIndex });
                            // Priority 2: Text is selected. Do nothing and let the global listener handle it.
                            } else if (selectedText) {
                                // Don't stop propagation, allow the global selection menu to appear.
                            } else {
                            // Priority 3: No link and no selection. Show the task menu.
                                handleTaskContextMenu(e);
                            }
                        }} onClick={(e) => { // Also handle left-clicks for links
                            const target = e.target as HTMLElement;
                            if (target.tagName === 'A') {
                                e.preventDefault();
                                e.stopPropagation(); // Also stop propagation on left-click to be consistent
                                const url = target.getAttribute('href');
                                if (url) window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
                            }
                        }}>
                            <div className="description-header" onContextMenu={handleTaskContextMenu}>
                                <strong>Description:</strong>
                                <button className="icon-button copy-btn" title="Copy Description Text" onClick={handleCopyDescription}><i className="fas fa-copy"></i></button>
                                <button className="icon-button copy-btn" title="Copy Description HTML" onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(task.description || ''); showToast('Description HTML copied!');
                                }}><i className="fas fa-code"></i></button>
                                <button className="icon-button copy-btn" title="Copy All (Description + Notes)" onClick={handleCopyAll}><i className="fas fa-copy"></i> All</button>
                            </div>
                            <Checklist
                                sections={task.checklist || []}
                                onUpdate={(newSections) => handleFieldChange('checklist', newSections)}
                                onComplete={handleChecklistCompletion}
                                tasks={tasks}
                                setInboxMessages={setInboxMessages}
                                task={task}
                                taskId={task.id}
                                onTaskUpdate={onUpdate}
                                checklistRef={activeChecklistRef}
                                showToast={showToast}
                                isEditable={false}
                                focusItemId={focusChecklistItemId}
                                onFocusHandled={() => setFocusChecklistItemId(null)}
                                settings={settings}
                                handleGlobalToggleTimer={handleGlobalToggleTimer}
                                handlePrimeTask={handlePrimeTask}
                                handlePrimeTaskWithNewLog={handlePrimeTaskWithNewLog}
                                activeTimerEntry={activeTimerEntry}
                                activeTimerLiveTime={activeTimerLiveTime}
                                handleClearActiveTimer={handleClearActiveTimer}                                                                                   
                                onSettingsChange={onSettingsChange || setSettings}
                            />
                            <DescriptionEditor
                                description={task.description || ''}
                                onDescriptionChange={(html) => handleFieldChange('description', html)}
                                settings={settings}                                
                                onSettingsChange={onSettingsChange || setSettings}
                                editorKey={`task-description-${task.id}`} />
                        </div>
                        <div className="description-container" ref={notesRef}>
                            <div className="description-header">
                                <strong>Notes:</strong>
                                <button className="icon-button copy-btn" title="Copy Notes Text" onClick={handleCopyNotes}><i className="fas fa-copy"></i></button>                                
                                <button className="icon-button copy-btn" title="Copy Notes HTML" onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(task.notes || ''); showToast('Notes HTML copied!');
                                }}><i className="fas fa-code"></i></button>
                            </div>
                            <DescriptionEditor
                                description={task.notes || ''}
                                onDescriptionChange={(html) => handleFieldChange('notes', html)}
                                settings={settings}                                
                                onSettingsChange={onSettingsChange || setSettings}
                                editorKey={`task-notes-${task.id}`} />
                        </div>
                    </div>
                )}
                {activeTab === 'edit' && !task.completedDuration && (
                    <div className="task-item-details-form">
                        <label><h4>Task Title (ID: {task.id}):</h4>
                            <input type="text" value={task.text} onChange={(e) => handleFieldChange('text', e.target.value)} />
                        </label>
                        <label><h4>Category:</h4>
                            <select value={task.categoryId || ''} onChange={(e) => handleFieldChange('categoryId', Number(e.target.value))}>
                                <CategoryOptions categories={settings.categories} />
                            </select>
                        </label>
                        <label><h4>Task Title URL:</h4>
                            <input type="text" value={task.url || ''} onChange={(e) => handleFieldChange('url', e.target.value)} placeholder="https://example.com" />
                        </label>
                        <label><h4>Priority:</h4><select value={task.priority || 'Medium'} onChange={(e) => handleFieldChange('priority', e.target.value as any)}>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        </label>
                        <label><h4>Open Date:</h4>
                            <div className="date-input-group">
                                <input type="datetime-local" value={formatTimestampForInput(task.openDate)} onChange={(e) => handleFieldChange('openDate', parseInputTimestamp(e.target.value))} />
                                <div className="button-group">{(() => {
                                    const subtractTime = (amount: number, unit: 'minutes' | 'hours' | 'days') => {
                                        const baseTime = task.openDate ? new Date(task.openDate) : new Date();
                                        if (unit === 'minutes') baseTime.setMinutes(baseTime.getMinutes() - amount);
                                        if (unit === 'hours') baseTime.setHours(baseTime.getHours() - amount);
                                        if (unit === 'days') baseTime.setDate(baseTime.getDate() - amount);
                                        handleFieldChange('openDate', baseTime.getTime());
                                    };
                                    return <><button className="icon-button" onClick={() => handleFieldChange('openDate', undefined)} title="Clear Date"><i className="fas fa-times"></i></button>
                                        <button onClick={() => handleFieldChange('openDate', new Date().getTime())} title="Set to Now">NOW</button>
                                        <button onClick={() => { const d = new Date(task.openDate || Date.now()); d.setMinutes(0, 0, 0); handleFieldChange('openDate', d.getTime()); }} title="Round to Hour">:00</button>
                                        <button onClick={() => subtractTime(15, 'minutes')}>-15m</button> <button onClick={() => subtractTime(30, 'minutes')}>-30m</button>
                                        <button onClick={() => subtractTime(1, 'hours')}>-1h</button> <button onClick={() => subtractTime(2, 'hours')}>-2h</button>
                                        <button onClick={() => subtractTime(1, 'days')}>-1d</button> <button onClick={() => subtractTime(3, 'days')}>-3d</button>
                                    </>;
                                })()}
                                </div>
                            </div>
                        </label>
                        <label><h4>Complete By:</h4>
                            <div className="date-input-group">
                                <input type="datetime-local" value={formatTimestampForInput(task.completeBy)} onChange={(e) => handleFieldChange('completeBy', parseInputTimestamp(e.target.value))} />
                                <div className="button-group">{(() => {
                                    const addTime = (amount: number, unit: 'minutes' | 'hours' | 'days') => {
                                        const baseTime = task.completeBy ? new Date(task.completeBy) : new Date();
                                        if (unit === 'minutes') baseTime.setMinutes(baseTime.getMinutes() + amount);
                                        if (unit === 'hours') baseTime.setHours(baseTime.getHours() + amount);
                                        if (unit === 'days') baseTime.setDate(baseTime.getDate() + amount);
                                        handleFieldChange('completeBy', baseTime.getTime());
                                    };
                                    return <><button className="icon-button" onClick={() => handleFieldChange('completeBy', undefined)} title="Clear Date"><i className="fas fa-times"></i></button>
                                        <button onClick={() => handleFieldChange('completeBy', new Date().getTime())} title="Set to Now">NOW</button>
                                        <button onClick={() => {
                                            const baseTime = task.completeBy ? new Date(task.completeBy) : new Date();
                                            baseTime.setMinutes(0, 0, 0); 
                                            handleFieldChange('completeBy', baseTime.getTime());
                                        }} title="Round to Hour">:00</button>
                                        <button onClick={() => addTime(15, 'minutes')}>+15m</button> <button onClick={() => addTime(30, 'minutes')}>+30m</button>
                                        <button onClick={() => addTime(1, 'hours')}>+1h</button> <button onClick={() => addTime(2, 'hours')}>+2h</button>
                                        <button onClick={() => addTime(1, 'days')}>+1d</button> <button onClick={() => addTime(3, 'days')}>+3d</button>
                                    </>;
                                })()}</div>
                            </div>
                        </label>
                        <label><h4>Company:</h4>
                            <input type="text" value={task.company || ''} onChange={(e) => handleFieldChange('company', e.target.value)} />
                        </label>
                        <label><h4>Pay Rate ($/hr):</h4>
                            <input type="number" value={task.payRate || 0} onChange={(e) => handleFieldChange('payRate', Number(e.target.value))} />
                        </label>
                        <label><h4>Website URL:</h4>
                            <input type="text" value={task.websiteUrl || ''} onChange={(e) => handleFieldChange('websiteUrl', e.target.value)} placeholder="https://company.com" />
                        </label>
                        <label><h4>Image Links:</h4>
                            {(task.imageLinks || []).map((link, index) => (
                                <div key={index} className="image-link-edit">
                                    <input type="text" value={link} onChange={(e) => {
                                        const newLinks = [...(task.imageLinks || [])];
                                        newLinks[index] = e.target.value;
                                        handleFieldChange('imageLinks', newLinks);
                                    }} /><button className="icon-button" onClick={() => handleFieldChange('imageLinks', (task.imageLinks || []).filter((_, i) => i !== index))}><i className="fas fa-minus"></i></button>
                                </div>
                            ))}
                        </label><button className="add-link-btn" onClick={() => handleFieldChange('imageLinks', [...(task.imageLinks || []), ''])}>
                            <i className="fas fa-plus"></i> Add Image Link
                        </button>
                        <label><h4>Attachments:</h4>
                            {(task.attachments || []).map((file, index) => (
                                <div key={index} className="attachment-edit">
                                    <span className="attachment-name" onClick={() => window.electronAPI.manageFile({ action: 'open', filePath: file.path })} title={`Open ${file.name}`}>
                                        📄 {file.name}
                                    </span>
                                    <button className="icon-button" onClick={() => handleFieldChange('attachments', (task.attachments || []).filter((_, i) => i !== index))}><i className="fas fa-minus"></i></button>
                                </div>
                            ))}
                        </label><button className="add-link-btn" onClick={async () => {
                            const newFile = await window.electronAPI.manageFile({ action: 'select' });
                            if (newFile) {
                                handleFieldChange('attachments', [...(task.attachments || []), newFile]);
                            }
                        }}><i className="fas fa-plus"></i> Attach File</button>
                        {tabHeaders}
                        <div className="description-header" style={{ marginBottom: '10px' }}>
                            <strong>Description:</strong>
                            <button className="icon-button copy-btn" title="Copy Description Text" onClick={handleCopyDescription}><i className="fas fa-copy"></i></button>
                            <button className="icon-button copy-btn" title="Copy Description HTML" onClick={() => {
                                navigator.clipboard.writeText(task.description || ''); showToast('Description HTML copied!');
                            }}><i className="fas fa-code"></i></button>
                            <button className="icon-button copy-btn" title="Copy All (Description + Notes)" onClick={handleCopyAll}><i className="fas fa-copy"></i> All</button>
                        </div>
                        <Checklist
                            sections={task.checklist || []}
                            onUpdate={(newSections) => handleFieldChange('checklist', newSections)}
                            onComplete={handleChecklistCompletion}
                            isEditable={true}
                            onTaskUpdate={onUpdate}
                            task={task}
                            tasks={tasks}
                            setInboxMessages={setInboxMessages} // This was missing
                            checklistRef={activeChecklistRef}
                            taskId={task.id}
                            showToast={showToast}
                            focusItemId={focusChecklistItemId}
                            onFocusHandled={() => setFocusChecklistItemId(null)}
                            settings={settings}
                            onSettingsChange={onSettingsChange || setSettings}
                            handleGlobalToggleTimer={handleGlobalToggleTimer}                            
                            handlePrimeTaskWithNewLog={handlePrimeTaskWithNewLog}
                            handlePrimeTask={handlePrimeTask}
                            activeTimerEntry={activeTimerEntry}
                            activeTimerLiveTime={activeTimerLiveTime}
                            handleClearActiveTimer={handleClearActiveTimer}
                        />
                        <DescriptionEditor
                            description={task.description || ''}
                            onDescriptionChange={(html) => handleFieldChange('description', html)}
                            settings={settings}                            
                            onSettingsChange={onSettingsChange || setSettings}
                            editorKey={`edit-description-${task.id}`} />
                        <div className="description-container">
                            <strong>Notes:</strong>
                            <DescriptionEditor
                                description={task.notes || ''}
                                onDescriptionChange={(html) => handleFieldChange('notes', html)}
                                settings={settings}                                
                                onSettingsChange={onSettingsChange || setSettings}
                                editorKey={`edit-notes-${task.id}`} />
                        </div>
                        <label className="checkbox-label flexed-column">
                            <input type="checkbox" checked={task.isRecurring || false} onChange={(e) => handleFieldChange('isRecurring', e.target.checked)} />
                            <span className="checkbox-label-text">Re-occurring Task</span>
                        </label>
                        <label className="checkbox-label flexed-column">
                            <input type="checkbox" checked={task.isDailyRecurring || false} onChange={(e) => handleFieldChange('isDailyRecurring', e.target.checked)} />
                            <span className="checkbox-label-text">Repeat Daily</span>
                        </label>
                        <label className="checkbox-label flexed-column">
                            <input type="checkbox" checked={task.isWeeklyRecurring || false} onChange={(e) => handleFieldChange('isWeeklyRecurring', e.target.checked)} />
                            <span className="checkbox-label-text">Repeat Weekly</span>
                        </label>
                        <label className="checkbox-label flexed-column">
                            <input type="checkbox" checked={task.isMonthlyRecurring || false} onChange={(e) => handleFieldChange('isMonthlyRecurring', e.target.checked)} />
                            <span className="checkbox-label-text">Repeat Monthly</span>
                        </label>
                        <label className="checkbox-label flexed-column">
                            <input type="checkbox" checked={task.isYearlyRecurring || false} onChange={(e) => handleFieldChange('isYearlyRecurring', e.target.checked)} />
                            <span className="checkbox-label-text">Repeat Yearly</span>
                        </label>
                        <label className="checkbox-label flexed-column">
                            <input type="checkbox" checked={task.isAutocomplete || false} onChange={(e) => handleFieldChange('isAutocomplete', e.target.checked)} />
                            <span className="checkbox-label-text">Autocomplete on Deadline</span>
                        </label>
                        <label><h4>Starts Task on Complete:</h4>
                            <select
                                value={task.startsTaskIdOnComplete || ''}
                                onChange={(e) => handleFieldChange('startsTaskIdOnComplete', e.target.value ? Number(e.target.value) : undefined)}
                            >
                                <option value="">-- None --</option>
                                {tasks
                                    .filter(t => t.id !== task.id) 
                                    .map(t => (
                                        <option key={t.id} value={t.id}>{t.text}</option>
                                    ))}
                            </select>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}