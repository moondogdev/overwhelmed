import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Settings, InboxMessage, ChecklistItem, ChecklistSection, TimeLogEntry, Attachment, Category, CodeSnippet } from '../types';
import { formatTimestampForInput, parseInputTimestamp, formatTimestamp } from '../utils';
import { TimeTrackerLog } from './TimeTrackerLog';
import { DescriptionEditor } from './Editors';
import { SimpleAccordion } from './sidebar/SimpleAccordion';
import { CodeEditor } from './CodeEditor';
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

  const isTransaction = useMemo(() => {
    if (!task.categoryId) return false;
    const category = settings.categories.find(c => c.id === task.categoryId);
    const parentCategory = category?.parentId ? settings.categories.find(c => c.id === category.parentId) : category;
    return parentCategory?.name === 'Transactions';
  }, [task.categoryId, settings.categories]);

  const [editingField, setEditingField] = useState<'description' | 'notes' | 'responses' | null>(null);
  const descriptionEditorRef = useRef<HTMLDivElement>(null);
  const notesEditorRef = useRef<HTMLDivElement>(null);
  const responsesEditorRef = useRef<HTMLDivElement>(null);
  const [editingSnippetId, setEditingSnippetId] = useState<number | null>(null);

  const defaultEditAccordions = {
    taskDetails: true,
    scheduling: true,
    associatedInfo: true,
    financials: false,
    attachments: false,
    checklist: true,
    description: false,
    notes: false,
    responses: false,
    codeSnippets: false,
    recurring: false,
  };
  const defaultViewAccordions = {
    workTimer: false,
    attachments: false,
    checklist: true,
    description: true,
    notes: false,
    responses: false,
    codeSnippets: false,
  };
  const openEditAccordions = settings.openTaskEditAccordions?.[task.id] ?? defaultEditAccordions;
  const openViewAccordions = settings.openTaskViewAccordions?.[task.id] ?? defaultViewAccordions;

  useEffect(() => {
    if (editingField === 'description') descriptionEditorRef.current?.focus();
    else if (editingField === 'notes') notesEditorRef.current?.focus();
    else if (editingField === 'responses') responsesEditorRef.current?.focus();
  }, [editingField]);

    // This effect sets up a single listener for global checklist commands.
    // This prevents the "MaxListenersExceededWarning" by ensuring we don't add a new listener for every checklist instance.
    useEffect(() => {
        const handleGlobalCommand = (payload: { command: string }) => {
            // We find the command handler on the currently active checklist instance via its ref.
            if (activeChecklistRef.current && 'handleGlobalChecklistCommand' in activeChecklistRef.current) {
                (activeChecklistRef.current as any).handleGlobalChecklistCommand(payload);
            }
        };

        const handleSectionCommand = (payload: { command: string; sectionId?: number; blockId?: number; }) => {
            if (activeChecklistRef.current && 'handleSectionCommand' in activeChecklistRef.current) {
                (activeChecklistRef.current as any).handleSectionCommand(payload);
            }
        };

        const handleItemCommand = (payload: { command: string; sectionId: number; itemId: number; color?: string; }) => {
            if (activeChecklistRef.current && 'handleItemCommand' in activeChecklistRef.current) {
                (activeChecklistRef.current as any).handleItemCommand(payload);
            }
        };

        const cleanup = window.electronAPI.on('checklist-main-header-command', handleGlobalCommand);
        const cleanupSection = window.electronAPI.on('checklist-section-command', handleSectionCommand);
        const cleanupItem = window.electronAPI.on('checklist-item-command', handleItemCommand);
        return () => { cleanup(); cleanupSection(); cleanupItem(); };

    }, [activeChecklistRef]); // The ref itself is stable, so this runs only once.

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

    const handleSetOpenViewAccordions = (updater: React.SetStateAction<{ [key: string]: boolean }>) => {
        const newState = typeof updater === 'function' ? updater(openViewAccordions) : updater;
        setSettings(prev => ({
            ...prev,
            openTaskViewAccordions: {
                ...(prev.openTaskViewAccordions || {}),
                [task.id]: newState,
            },
        }));
    };

    const handleSetOpenEditAccordions = (updater: React.SetStateAction<{ [key: string]: boolean }>) => {
        const newState = typeof updater === 'function' ? updater(openEditAccordions) : updater;
        setSettings(prev => ({
            ...prev,
            openTaskEditAccordions: {
                ...(prev.openTaskEditAccordions || {}),
                [task.id]: newState,
            },
        }));
    };

    const handleFieldChange = (field: keyof Task, value: any) => {
        onUpdate({ ...task, [field]: value });
    };

    const handleAddCodeSnippet = () => {
        const newSnippet: CodeSnippet = { id: Date.now() + Math.random(), title: 'New Snippet', code: '', language: 'plaintext' };
        handleFieldChange('codeSnippets', [...(task.codeSnippets || []), newSnippet]);
        setEditingSnippetId(newSnippet.id);
    };

    const handleUpdateCodeSnippet = (id: number, newSnippet: Partial<CodeSnippet>) => {
        const updatedSnippets = (task.codeSnippets || []).map(s => s.id === id ? { ...s, ...newSnippet } : s);
        handleFieldChange('codeSnippets', updatedSnippets);
    };

    const handleDeleteCodeSnippet = (id: number) => {
        const updatedSnippets = (task.codeSnippets || []).filter(s => s.id !== id);
        handleFieldChange('codeSnippets', updatedSnippets);
    };


    const handleTaskContextMenu = (e: React.MouseEvent) => {
        e.stopPropagation(); // CRITICAL: Stop the event from bubbling up to the global listener.
        const isInEditMode = activeTab === 'edit';
        const hasCompletedTasks = completedTasks.length > 0;
        window.electronAPI.showTaskContextMenu({ taskId: task.id, x: e.clientX, y: e.clientY, isInEditMode, hasCompletedTasks, categories: settings.categories });
    };

    // Hooks must be called at the top level, not inside conditionals.
    const descriptionRef = useRef<HTMLDivElement>(null);
    const notesRef = useRef<HTMLDivElement>(null);
    const responsesRef = useRef<HTMLDivElement>(null);
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

    const handleCopyResponses = async () => {
        if (responsesRef.current) {
            try {
                await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
                // The responses are inside a DescriptionEditor, which has a content-editable div.
                // We need to find that div to get its innerHTML and innerText.
                const editorDiv = responsesRef.current.querySelector('.rich-text-editor');
                if (editorDiv) {
                    const html = editorDiv.innerHTML;
                    const text = (editorDiv as HTMLElement).innerText;
                    const htmlBlob = new Blob([html], { type: 'text/html' });
                    const textBlob = new Blob([text], { type: 'text/plain' });
                    const data = [new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })];
                    await navigator.clipboard.write(data);
                    showToast('Responses copied!');
                }
            } catch (err) {
                console.error('Failed to copy responses: ', err);
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
        <div className="tab-headers">
            <button onClick={() => handleTabClick('ticket')} className={activeTab === 'ticket' ? 'active' : ''}>{isTransaction ? 'Details' : 'Task'}</button>
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
                        <div className="view-tab-actions" style={{ marginBottom: '10px' }}>
                            <button className="icon-button" title="Open All Sections" onClick={() => handleSetOpenViewAccordions(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: true }), {}))}><i className="fas fa-folder-open"></i></button>
                            <button className="icon-button" title="Collapse All Sections" onClick={() => handleSetOpenViewAccordions(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}))}><i className="fas fa-folder"></i></button>
                        </div>
                        <h3 onContextMenu={handleTaskContextMenu}>{task.text} (ID: {task.id})</h3>
                        {isTransaction ? 
                            <>
                                <p><strong>Main Category:</strong> Transactions</p>
                                {task.categoryId && <p><strong>Sub-Category:</strong> {settings.categories.find(c => c.id === task.categoryId)?.name || 'Uncategorized'}</p>}
                                {task.accountId && <p><strong>Account:</strong> {settings.accounts.find(a => a.id === task.accountId)?.name || 'N/A'}</p>}
                                {task.taxCategoryId && <p><strong>Tax Category:</strong> {settings.taxCategories?.find(tc => tc.id === task.taxCategoryId)?.name || 'N/A'}</p>}
                                {task.transactionType && task.transactionType !== 'none' && <p><strong>Transaction Type:</strong> <span style={{ textTransform: 'capitalize' }}>{task.transactionType}</span></p>}
                                {task.transactionAmount && <p><strong>Transaction Amount:</strong> <span className={task.transactionAmount > 0 ? 'income-text' : 'expense-text'}>${Math.abs(task.transactionAmount).toFixed(2)}</span></p>}
                                <p><strong>Date:</strong> {formatTimestamp(task.openDate)}</p>
                            </> : <>
                                {task.url && <p><strong>URL:</strong> <span className="link-with-copy"><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI.openExternalLink({ url: task.url || '', browserPath: settings.browsers[settings.activeBrowserIndex]?.path }); }}>{task.url}</a><button className="icon-button copy-btn" title="Copy URL" onClick={() => { navigator.clipboard.writeText(task.url || ''); showToast('URL copied!'); }}><i className="fas fa-copy"></i></button></span></p>}
                                {task.websiteUrl && <p><strong>Website URL:</strong> <span className="link-with-copy"><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI.openExternalLink({ url: task.websiteUrl || '', browserPath: settings.browsers[settings.activeBrowserIndex]?.path }); }}>{task.websiteUrl}</a><button className="icon-button copy-btn" title="Copy URL" onClick={() => { navigator.clipboard.writeText(task.websiteUrl || ''); showToast('Website URL copied!'); }}><i className="fas fa-copy"></i></button></span></p>}
                                <p><strong>Category:</strong> {settings.categories.find(c => c.id === task.categoryId)?.name || 'Uncategorized'}</p>
                                <p><strong>Priority:</strong> {task.priority || 'Medium'}</p>                                
                                <p><strong>Open Date:</strong> {formatTimestamp(task.openDate)}</p>                                
                            </>
                        }
                        {!isTransaction && <p><strong>Time Open:</strong> <TimeOpen startDate={task.createdAt} /></p>}
                        {task.completeBy && <p><strong>Complete By:</strong> {formatTimestamp(task.completeBy)}</p>}
                        {task.completeBy && <p><strong>Time Left:</strong> <TimeLeft task={task} onUpdate={onUpdate} onNotify={handleTimerNotify} settings={settings} /></p>}{task.company && <p><strong>Company:</strong> <span className="link-with-copy">{task.company}<button className="icon-button copy-btn" title="Copy Company" onClick={() => { navigator.clipboard.writeText(task.company || ''); showToast('Company copied!'); }}><i className="fas fa-copy"></i></button></span></p>}
                        {!isTransaction && (
                            <SimpleAccordion title={<div className="description-header"><strong>Work Timer</strong></div>}
                                isOpen={openViewAccordions['workTimer']}
                                onToggle={() => handleSetOpenViewAccordions(prev => ({ ...prev, workTimer: !prev.workTimer }))}
                            >
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
                            </SimpleAccordion>
                        )}
                        {task.payRate > 0 && (
                            <div>
                                <p><strong>Pay Rate:</strong> ${task.payRate.toFixed(2)}/hr</p>
                                <div><strong>Task Cost:</strong>
                                    {(task.manualTime || 0) > 0
                                        ? <span> ${(((task.manualTime || 0) / (1000 * 60 * 60)) * task.payRate).toFixed(2)}</span>
                                        : <span style={{ fontStyle: 'italic', opacity: 0.7 }}> (requires time log)</span>}
                                </div>
                            </div>
                        )}                        
                        <SimpleAccordion title={
                            <div className="description-header">
                                <strong>Attachments</strong>
                                <div className="header-actions"></div>
                            </div>
                        }
                            isOpen={openViewAccordions['attachments']} onToggle={() => handleSetOpenViewAccordions(prev => ({ ...prev, attachments: !prev.attachments }))}
                        >
                            <div className="attachments-display">
                                {task.imageLinks && task.imageLinks.length > 0 && (
                                    <div className="image-links-display">
                                        {task.imageLinks.map((link, index) => (
                                            <div key={index} className="image-link-item">
                                                <img src={link} alt={`Image ${index + 1}`} />
                                                <div className="image-link-actions">
                                                    <button className="icon-button" onClick={() => window.electronAPI.downloadImage(link)} title="Download Image"><i className="fas fa-download"></i></button>
                                                    <button className="icon-button" onClick={() => { navigator.clipboard.writeText(link); showToast('Image URL copied!'); }} title="Copy URL"><i className="fas fa-copy"></i></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {(task.attachments || []).map((file, index) => (
                                    <div key={index} className="attachment-item">
                                        <span className="attachment-name" onClick={() => window.electronAPI.manageFile({ action: 'open', filePath: file.path, fileName: file.name })} title={`Open ${file.name}`}>
                                            <i className="fas fa-file-alt"></i> {file.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <button className="add-link-btn" onClick={async (e) => { e.stopPropagation(); const newFile = await window.electronAPI.manageFile({ action: 'select' }); if (newFile) { handleFieldChange('attachments', [...(task.attachments || []), newFile]); } }}><i className="fas fa-plus"></i> Attach File</button>
                        </SimpleAccordion>
                        {!isTransaction && (
                            <SimpleAccordion title={<div className="description-header"><strong>Checklist</strong></div>}
                                isOpen={openViewAccordions['checklist']}
                                onToggle={() => handleSetOpenViewAccordions(prev => ({ ...prev, checklist: !prev.checklist }))}
                            >
                                <Checklist
                                    sections={task.checklist || []}
                                    onUpdate={(newSections) => handleFieldChange('checklist', newSections)}
                                    completedTasks={completedTasks}
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
                            </SimpleAccordion>
                        )}
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
                            if (target.tagName === 'A' && target.hasAttribute('href')) {
                                e.preventDefault();
                                e.stopPropagation(); // Also stop propagation on left-click to be consistent
                                const url = target.getAttribute('href');
                                if (url) window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
                            }
                        }}>
                            <div className="description-container">
                                <SimpleAccordion title={
                                    <div className="description-header" onContextMenu={handleTaskContextMenu}>
                                        <strong>Description:</strong>
                                        <div className="header-actions">
                                            {editingField !== 'description' && <button className="icon-button" onClick={(e) => { e.stopPropagation(); setEditingField('description'); }} title="Edit Description"><i className="fas fa-pencil-alt"></i></button>}
                                            <button className="icon-button copy-btn" title="Copy Description Text" onClick={(e) => { e.stopPropagation(); handleCopyDescription(); }}><i className="fas fa-copy"></i></button>
                                            <button className="icon-button copy-btn" title="Copy Description HTML" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(task.description || ''); showToast('Description HTML copied!'); }}><i className="fas fa-code"></i></button>
                                            <button className="icon-button copy-btn" title="Copy All (Description + Notes)" onClick={(e) => { e.stopPropagation(); handleCopyAll(); }}><i className="fas fa-copy"></i> All</button>
                                        </div>
                                    </div>
                                }
                                    isOpen={openViewAccordions['description']} onToggle={() => handleSetOpenViewAccordions(prev => ({ ...prev, description: !prev.description }))}
                                >
                                    {editingField === 'description' ? (
                                        <DescriptionEditor
                                            description={task.description || ''}
                                            onDescriptionChange={(html) => handleFieldChange('description', html)}
                                            settings={settings}
                                            onSettingsChange={onSettingsChange || setSettings}
                                            editorKey={`task-description-${task.id}`}
                                            onBlur={() => setEditingField(null)}
                                            editorRef={descriptionEditorRef} />
                                    ) : (
                                        <div className="rich-text-block-view" dangerouslySetInnerHTML={{ __html: task.description || '<p><i>No description. Double-click to add one.</i></p>' }} onDoubleClick={() => setEditingField('description')} />
                                    )}
                                </SimpleAccordion>
                            </div>
                        </div>
                        {!isTransaction && (
                            <>
                                <SimpleAccordion title={
                                    <div className="description-header" ref={notesRef} onContextMenu={handleTaskContextMenu}>
                                        <strong>Notes:</strong>
                                        <div className="header-actions">
                                            {editingField !== 'notes' && <button className="icon-button" onClick={(e) => { e.stopPropagation(); setEditingField('notes'); }} title="Edit Notes"><i className="fas fa-pencil-alt"></i></button>}
                                            <button className="icon-button copy-btn" title="Copy Notes Text" onClick={(e) => { e.stopPropagation(); handleCopyNotes(); }}><i className="fas fa-copy"></i></button>
                                            <button className="icon-button copy-btn" title="Copy Notes HTML" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(task.notes || ''); showToast('Notes HTML copied!'); }}><i className="fas fa-code"></i></button>
                                        </div>
                                    </div>
                                }
                                    isOpen={openViewAccordions['notes']} onToggle={() => handleSetOpenViewAccordions(prev => ({ ...prev, notes: !prev.notes }))}
                                >
                                    {editingField === 'notes' ? (
                                        <DescriptionEditor
                                            description={task.notes || ''}
                                            onDescriptionChange={(html) => handleFieldChange('notes', html)}
                                            settings={settings}
                                            onSettingsChange={onSettingsChange || setSettings}
                                            editorKey={`task-notes-${task.id}`}
                                            onBlur={() => setEditingField(null)}
                                            editorRef={notesEditorRef} />
                                    ) : (
                                        <div className="rich-text-block-view" dangerouslySetInnerHTML={{ __html: task.notes || '<p><i>No notes. Double-click to add some.</i></p>' }} onDoubleClick={() => setEditingField('notes')} />
                                    )}
                                </SimpleAccordion>
                                <SimpleAccordion title={
                                    <div className="description-header" ref={responsesRef} onContextMenu={handleTaskContextMenu}>
                                        <strong>Responses:</strong>
                                        <div className="header-actions">
                                            {editingField !== 'responses' && <button className="icon-button" onClick={(e) => { e.stopPropagation(); setEditingField('responses'); }} title="Edit Responses"><i className="fas fa-pencil-alt"></i></button>}
                                            <button className="icon-button copy-btn" title="Copy Responses Text" onClick={(e) => { e.stopPropagation(); handleCopyResponses(); }}><i className="fas fa-copy"></i></button>
                                            <button className="icon-button copy-btn" title="Copy Responses HTML" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(task.responses || ''); showToast('Responses HTML copied!'); }}><i className="fas fa-code"></i></button>
                                        </div>
                                    </div>
                                }
                                    isOpen={openViewAccordions['responses']} onToggle={() => handleSetOpenViewAccordions(prev => ({ ...prev, responses: !prev.responses }))}
                                >
                                    {editingField === 'responses' ? (
                                        <DescriptionEditor
                                            description={task.responses || ''}
                                            onDescriptionChange={(html) => handleFieldChange('responses', html)}
                                            settings={settings}
                                            onSettingsChange={onSettingsChange || setSettings}
                                            editorKey={`task-responses-${task.id}`}
                                            onBlur={() => setEditingField(null)}
                                            editorRef={responsesEditorRef} />
                                    ) : (
                                        <div className="rich-text-block-view" dangerouslySetInnerHTML={{ __html: task.responses || '<p><i>No responses. Double-click to add some.</i></p>' }} onDoubleClick={() => setEditingField('responses')} />
                                    )}
                                </SimpleAccordion>
                                <SimpleAccordion
                                    title={
                                        <div className="description-header">
                                            <strong>Code Snippets:</strong>
                                            <div className="header-actions"></div>
                                        </div>
                                    }
                                    isOpen={openViewAccordions['codeSnippets']}
                                    onToggle={() => handleSetOpenViewAccordions(prev => ({ ...prev, codeSnippets: !prev.codeSnippets }))}
                                >
                                    <div className="code-snippets-list">
                                        {(task.codeSnippets || []).map(snippet => (
                                            <CodeEditor
                                                key={snippet.id}
                                                snippet={snippet}
                                                onUpdate={handleUpdateCodeSnippet}
                                                onDelete={handleDeleteCodeSnippet}
                                                showToast={showToast}
                                                isEditable={editingSnippetId === snippet.id}
                                                onSetEditable={(isEditing) => setEditingSnippetId(isEditing ? snippet.id : null)}
                                                settings={settings}
                                                onSettingsChange={onSettingsChange || setSettings} />
                                        ))}
                                    </div>
                                    <button className="add-link-btn" onClick={(e) => { e.stopPropagation(); handleAddCodeSnippet(); }}><i className="fas fa-plus"></i> Add Snippet</button>
                                </SimpleAccordion>
                                {/* Closing div for description-container */}
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'edit' && !task.completedDuration && <div className="task-item-details-form">
                        <div className="edit-view-actions">
                            <button className="icon-button" title="Open All" onClick={() => handleSetOpenEditAccordions(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: true }), {}))}><i className="fas fa-folder-open"></i></button>
                            <button className="icon-button" title="Close All" onClick={() => handleSetOpenEditAccordions(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}))}><i className="fas fa-folder"></i></button>
                        </div>
                        <SimpleAccordion title={<div className="description-header"><strong>Task Details</strong></div>}
                            isOpen={openEditAccordions['taskDetails']} 
                            onToggle={() => handleSetOpenEditAccordions(prev => ({ ...prev, taskDetails: !prev.taskDetails }))}
                        >
                            <label><h4>Task Title (ID: {task.id}):</h4>
                                <input type="text" value={task.text} onChange={(e) => handleFieldChange('text', e.target.value)} />
                            </label>
                            {!isTransaction && (
                                <label><h4>Task Title URL:</h4>
                                    <input type="text" value={task.url || ''} onChange={(e) => handleFieldChange('url', e.target.value)} placeholder="https://example.com" />
                                </label>
                            )}
                            <label><h4>Category:</h4>
                                <select value={task.categoryId || ''} onChange={(e) => handleFieldChange('categoryId', Number(e.target.value))}>
                                    <CategoryOptions categories={settings.categories} />
                                </select>
                            </label>
                        </SimpleAccordion>
                        <SimpleAccordion title={<div className="description-header"><strong>Scheduling & Priority</strong></div>}
                            isOpen={openEditAccordions['scheduling']}
                            onToggle={() => handleSetOpenEditAccordions(prev => ({ ...prev, scheduling: !prev.scheduling }))}
                        >
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
                            {!isTransaction && (
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
                            )}
                            {!isTransaction && (
                                <label><h4>Priority:</h4><select value={task.priority || 'Medium'} onChange={(e) => handleFieldChange('priority', e.target.value as any)}>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                                </label>
                            )}
                        </SimpleAccordion>
                        <SimpleAccordion title={<div className="description-header"><strong>Associated Info</strong></div>}
                            isOpen={openEditAccordions['associatedInfo']}
                            onToggle={() => handleSetOpenEditAccordions(prev => ({ ...prev, associatedInfo: !prev.associatedInfo }))}
                        >
                            <label><h4>Company:</h4>
                                <input type="text" value={task.company || ''} onChange={(e) => handleFieldChange('company', e.target.value)} />
                            </label>
                            {!isTransaction && (
                                <>
                                    <label><h4>Website URL:</h4>
                                        <input type="text" value={task.websiteUrl || ''} onChange={(e) => handleFieldChange('websiteUrl', e.target.value)} placeholder="https://company.com" />
                                    </label>                                
                                </>
                            )}
                        </SimpleAccordion>
                        <SimpleAccordion title={<div className="description-header"><strong>Financial Details</strong></div>}
                            isOpen={openEditAccordions['financials']}
                            onToggle={() => handleSetOpenEditAccordions(prev => ({ ...prev, financials: !prev.financials }))}
                        >
                            {!isTransaction && (
                                <label><h4>Pay Rate ($/hr):</h4>
                                    <input type="number" value={task.payRate || 0} onChange={(e) => handleFieldChange('payRate', Number(e.target.value))} />
                                </label>
                            )}
                            {((!isTransaction && (task.payRate || 0) > 0) || (task.transactionType === 'income')) && (
                                <label><h4>Income Type:</h4>
                                    <select value={task.incomeType || 'w2'} onChange={(e) => handleFieldChange('incomeType', e.target.value as 'w2' | 'business' | 'reimbursement')}>
                                        <option value="w2">W-2 Wage</option>
                                        <option value="business">Business Earning</option>
                                        <option value="reimbursement">Reimbursement / Non-Taxable</option>
                                    </select>
                                </label>
                            )}
                            <label><h4>Transaction:</h4>
                            <div className="transaction-input-group">
                                <input
                                type="number"
                                placeholder="0.00"
                                value={task.transactionAmount ? Math.abs(task.transactionAmount) : ''}
                                onChange={(e) => {
                                    const rawAmount = parseFloat(e.target.value) || 0;                                
                                    const type = rawAmount === 0 ? 'none' : (task.transactionType === 'none' ? 'expense' : task.transactionType);
                                    let finalAmount = rawAmount;
                                    if (task.transactionType === 'expense') {
                                    finalAmount = -Math.abs(rawAmount);
                                    } else if (task.transactionType === 'income') {
                                    finalAmount = Math.abs(rawAmount);
                                    }
                                    onUpdate({ ...task, transactionAmount: finalAmount });
                                }}
                                />
                                <div className="transaction-type-toggle">
                                <button className={`none-btn ${(task.transactionType || 'none') === 'none' || !task.transactionAmount ? 'active' : ''}`} onClick={() => {
                                    onUpdate({ ...task, transactionType: 'none', transactionAmount: 0 });
                                }}>None</button>
                                <button className={`transfer-btn ${task.transactionType === 'transfer' && task.transactionAmount !== 0 ? 'active' : ''}`} onClick={() => {
                                    const currentAmount = task.transactionAmount || 1;
                                    onUpdate({ ...task, transactionType: 'transfer', transactionAmount: currentAmount });
                                }}>Transfer</button>
                                <button className={`expense-btn ${task.transactionType === 'expense' && task.transactionAmount !== 0 ? 'active' : ''}`} onClick={() => {
                                    const currentAmount = Math.abs(task.transactionAmount || 1);
                                    onUpdate({ ...task, transactionType: 'expense', transactionAmount: -currentAmount });
                                }}>Expense</button>
                                <button className={`income-btn ${task.transactionType === 'income' && task.transactionAmount !== 0 ? 'active' : ''}`} onClick={() => {
                                    const currentAmount = Math.abs(task.transactionAmount || 1);
                                    onUpdate({ ...task, transactionType: 'income', transactionAmount: currentAmount });
                                }}>Income</button>
                                </div>
                            </div>
                            </label>
                            {task.transactionAmount !== 0 && (
                            <label><h4>Account:</h4>
                                <select value={task.accountId || ''} onChange={(e) => handleFieldChange('accountId', Number(e.target.value) || undefined)}>
                                <option value="">-- None --</option>
                                {settings.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </label>
                            )}
                            {task.transactionAmount !== 0 && (
                            <label><h4>Tax Category:</h4>
                                <select value={task.taxCategoryId || ''} onChange={(e) => handleFieldChange('taxCategoryId', Number(e.target.value) || undefined)}>
                                <option value="">-- None --</option>
                                {(settings.taxCategories || []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </label>
                            )}
                        </SimpleAccordion>                        
                        <SimpleAccordion title={
                            <div className="description-header">
                                <strong>Attachments</strong>
                                <div className="header-actions"></div>
                            </div>
                        } isOpen={openEditAccordions['attachments']} onToggle={() => handleSetOpenEditAccordions(prev => ({ ...prev, attachments: !prev.attachments }))}
                        >
                            {(task.imageLinks || []).map((link, index) => (
                                <div key={index} className="attachment-edit image-link-edit">
                                    <input type="text" value={link} placeholder="https://example.com/image.png" onChange={(e) => {
                                        const newLinks = [...(task.imageLinks || [])];
                                        newLinks[index] = e.target.value;
                                        handleFieldChange('imageLinks', newLinks);
                                    }} />
                                    <button className="icon-button" onClick={() => handleFieldChange('imageLinks', (task.imageLinks || []).filter((_, i) => i !== index))}><i className="fas fa-minus"></i></button>
                                </div>
                            ))}
                            {(task.attachments || []).map((file, index) => (
                                <div key={index} className="attachment-edit">
                                    <span className="attachment-name" onClick={() => window.electronAPI.manageFile({ action: 'open', filePath: file.path, fileName: file.name })} title={`Open ${file.name}`}>
                                        <i className="fas fa-file-alt"></i> {file.name}
                                    </span>
                                    <button className="icon-button" onClick={() => handleFieldChange('attachments', (task.attachments || []).filter((_, i) => i !== index))}><i className="fas fa-minus"></i></button>
                                </div>
                            ))}
                            <div className="attachment-actions">
                                <button className="add-link-btn" onClick={(e) => { e.stopPropagation(); handleFieldChange('imageLinks', [...(task.imageLinks || []), '']); }}><i className="fas fa-plus"></i> Add Image Link</button>
                                <button className="add-link-btn" onClick={async (e) => { e.stopPropagation(); const newFile = await window.electronAPI.manageFile({ action: 'select' }); if (newFile) { handleFieldChange('attachments', [...(task.attachments || []), newFile]); } }}><i className="fas fa-plus"></i> Attach File</button>
                            </div>
                        </SimpleAccordion>
                        { /* !isTransaction && tabHeaders */ }
                        
                        {!isTransaction && (
                            <SimpleAccordion title={<div className="description-header"><strong>Checklist</strong></div>}
                                isOpen={openEditAccordions['checklist']}
                                onToggle={() => handleSetOpenEditAccordions(prev => ({ ...prev, checklist: !prev.checklist }))}
                            >
                                <Checklist
                                    sections={task.checklist || []}
                                    onUpdate={(newSections) => handleFieldChange('checklist', newSections)}
                                    completedTasks={completedTasks}
                                    onComplete={handleChecklistCompletion}
                                    isEditable={true}
                                    onTaskUpdate={onUpdate}
                                    task={task}
                                    tasks={tasks}
                                    setInboxMessages={setInboxMessages}
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
                            </SimpleAccordion>
                        )}
                        <div className="description-container">
                            <SimpleAccordion
                                isOpen={openEditAccordions['description']}
                                onToggle={() => handleSetOpenEditAccordions(prev => ({ ...prev, description: !prev.description }))}
                                title={
                                <div className="description-header">
                                    <strong>Description:</strong>
                                    <div className="header-actions">
                                        <button className="icon-button copy-btn" title="Copy Description Text" onClick={(e) => { e.stopPropagation(); handleCopyDescription(); }}><i className="fas fa-copy"></i></button>
                                        <button className="icon-button copy-btn" title="Copy Description HTML" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(task.description || ''); showToast('Description HTML copied!'); }}><i className="fas fa-code"></i></button>
                                        <button className="icon-button copy-btn" title="Copy All (Description + Notes)" onClick={(e) => { e.stopPropagation(); handleCopyAll(); }}><i className="fas fa-copy"></i> All</button>
                                    </div>
                                </div>
                            }>
                                <DescriptionEditor
                                    description={task.description || ''}
                                    onDescriptionChange={(html) => handleFieldChange('description', html)}
                                    settings={settings}
                                    onSettingsChange={onSettingsChange || setSettings}
                                    editorKey={`edit-description-${task.id}`} />
                            </SimpleAccordion>
                        </div>
                        {!isTransaction && (
                            <>
                                <SimpleAccordion title={<div className="description-header"><strong>Notes:</strong></div>}
                                    isOpen={openEditAccordions['notes']}
                                    onToggle={() => handleSetOpenEditAccordions(prev => ({ ...prev, notes: !prev.notes }))}
                                >
                                    <DescriptionEditor
                                        description={task.notes || ''}
                                        onDescriptionChange={(html) => handleFieldChange('notes', html)}
                                        settings={settings}                                
                                        onSettingsChange={onSettingsChange || setSettings}
                                        editorKey={`edit-notes-${task.id}`} 
                                    />
                                </SimpleAccordion>
                                <SimpleAccordion title={<div className="description-header"><strong>Responses:</strong></div>}
                                    isOpen={openEditAccordions['responses']}
                                    onToggle={() => handleSetOpenEditAccordions(prev => ({ ...prev, responses: !prev.responses }))}
                                >
                                    <DescriptionEditor
                                        description={task.responses || ''}
                                        onDescriptionChange={(html) => handleFieldChange('responses', html)}
                                        settings={settings}
                                        onSettingsChange={onSettingsChange || setSettings}
                                        editorKey={`edit-responses-${task.id}`} 
                                    />
                                </SimpleAccordion>
                                <SimpleAccordion
                                    isOpen={openEditAccordions['codeSnippets']}
                                    onToggle={() => handleSetOpenEditAccordions(prev => ({ ...prev, codeSnippets: !prev.codeSnippets }))}
                                    title={
                                        <div className="description-header">
                                            <strong>Code Snippets:</strong>
                                            <div className="header-actions"></div>
                                        </div>
                                    }
                                >
                                    <div className="code-snippets-list">
                                        {(task.codeSnippets || []).map(snippet => (
                                            <CodeEditor
                                                key={snippet.id}
                                                snippet={snippet}
                                                onUpdate={handleUpdateCodeSnippet}
                                                onDelete={handleDeleteCodeSnippet}
                                                showToast={showToast}
                                                isEditable={true} // Always editable in the main edit view
                                                onSetEditable={() => {}}
                                                settings={settings}
                                                onSettingsChange={onSettingsChange || setSettings} />
                                        ))}
                                    </div>
                                    <button className="add-link-btn" onClick={(e) => { e.stopPropagation(); handleAddCodeSnippet(); }}><i className="fas fa-plus"></i> Add Snippet</button>
                                </SimpleAccordion>
                                {/* Closing div for description-container */}
                            </>
                        )}
                        {!isTransaction && (
                            <SimpleAccordion title={<div className="description-header"><strong>Recurring & Automation</strong></div>}                                
                                isOpen={openEditAccordions['recurring']}
                                onToggle={() => handleSetOpenEditAccordions(prev => ({ ...prev, recurring: !prev.recurring }))}
                            >
                                <div className="recurring-options-grid">
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
                                </div>
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
                                    <label><h4>Offset next task by (minutes):</h4>
                                        <input
                                            type="number"
                                            value={(task.linkedTaskOffset || 0) / 60000} // Display as minutes
                                            onChange={(e) => handleFieldChange('linkedTaskOffset', Number(e.target.value) * 60000)} // Store as ms
                                            placeholder="0"
                                        />
                                    </label>
                            </SimpleAccordion>
                        )}
                    </div>}
            </div>
            <div className="shortcut-key" style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.8em', color: '#aaa' }}>
                <span>Shortcuts: </span>
                <span><b>Ctrl+B</b>: Bold, <i>Ctrl+I</i>: Italic, <u>Ctrl+U</u>: Underline</span>
            </div>
        </div>
    );
}