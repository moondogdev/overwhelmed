import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Word, ChecklistItem, ChecklistSection, InboxMessage, Settings, TimeLogEntry, ChecklistTemplate } from '../types';
import { extractUrlFromText, formatChecklistForCopy, formatDate, formatTime } from '../utils';
import { PromptModal } from './Editors';
import './styles/Checklist.css';

// This component is only used by Checklist, so it's co-located here.
const ClickableText = ({ text, settings }: { text: string, settings: Settings }) => {
  const url = extractUrlFromText(text);

  if (!url) {
    return <span className="checklist-item-text">{text}</span>;
  }

  const parts = text.split(url);
  return (
    <span className="checklist-item-text">
      {parts[0]}
      <a href={url} onClick={(e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent toggling the checkbox
        window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
      }}>{url}</a>
      {parts[1]}
    </span>
  );
};

function ManageTemplatesModal({ isOpen, onClose, templates, onSettingsChange, showToast }: {
  isOpen: boolean;
  onClose: () => void;
  templates: any[];
  onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
  showToast: (message: string) => void;
}) {
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [confirmingDeleteTemplateId, setConfirmingDeleteTemplateId] = useState<number | null>(null);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // This effect synchronizes the local editing name with the props.
  // If the template being edited changes from the outside, update the input field.
  useEffect(() => {
    if (editingTemplateId !== null) {
      const currentTemplate = templates.find(t => t.id === editingTemplateId);
      if (currentTemplate) setEditingTemplateName(currentTemplate.name);
    }
  }, [templates, editingTemplateId]);

  if (!isOpen) return null;

  const handleRename = (templateId: number, newName: string) => {
    onSettingsChange(prevSettings => ({
      ...prevSettings,
      checklistTemplates: (prevSettings.checklistTemplates || []).map(t =>
        t.id === templateId ? { ...t, name: newName } : t
      ),
    }));
    setEditingTemplateId(null);
    showToast('Template renamed!');
  };

  const handleDelete = (templateId: number) => {
    if (confirmingDeleteTemplateId === templateId) {
      // This is the second click, perform the delete
      onSettingsChange(prevSettings => ({
        ...prevSettings,
        checklistTemplates: (prevSettings.checklistTemplates || []).filter(t => t.id !== templateId),
      }));
      showToast('Template deleted!');
      setConfirmingDeleteTemplateId(null); // Reset confirmation state
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current); // Clear any pending timeout
      }
    } else {
      // This is the first click, enter confirmation mode
      setConfirmingDeleteTemplateId(templateId);
      // Automatically cancel confirmation after 3 seconds
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteTemplateId(null), 3000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h4>Manage Checklist Templates</h4>
        <div className="template-management-list">
          {templates.map(template => (
            <div key={template.id} className="template-management-item">
              {editingTemplateId === template.id ? (
                <input
                  type="text"
                  value={editingTemplateName}
                  onChange={e => setEditingTemplateName(e.target.value)}
                  onBlur={() => handleRename(template.id, editingTemplateName)}
                  onKeyDown={e => e.key === 'Enter' && handleRename(template.id, editingTemplateName)}
                  autoFocus
                />
              ) : (
                <span className="template-name">{template.name}</span>
              )}
              <div className="template-actions">
                <button className="icon-button" onClick={() => {
                  setEditingTemplateId(template.id);
                  setEditingTemplateName(template.name);
                }} title="Rename Template">
                  <i className="fas fa-pencil-alt"></i> 
                </button>
                <button 
                  className={`icon-button delete-icon ${confirmingDeleteTemplateId === template.id ? 'confirm-delete' : ''}`} 
                  onClick={() => handleDelete(template.id)} 
                  title="Delete Template">
                  <i className={`fas ${confirmingDeleteTemplateId === template.id ? 'fa-check' : 'fa-trash'}`}></i>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
interface ChecklistProps {
  sections: ChecklistSection[] | ChecklistItem[];
  onUpdate: (newSections: ChecklistSection[]) => void;
  isEditable: boolean;
  onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
  words: Word[];
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  word: Word;
  wordId: number;
  onWordUpdate: (updatedWord: Word) => void;  
  checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; resetHistory: (sections: ChecklistSection[]) => void; }>;
  showToast: (message: string, duration?: number) => void;
  focusItemId: number | null;
  onFocusHandled: () => void;
  settings: Settings;
  onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
  handleGlobalToggleTimer: (wordId: number, entryId: number, entry?: TimeLogEntry, newTimeLog?: TimeLogEntry[]) => void;
  handleClearActiveTimer: () => void;
  handlePrimeTask: (wordId: number) => void;
  activeTimerEntry: TimeLogEntry | null; // Add for live time display
  activeTimerLiveTime: number; // Add for live time display
  handlePrimeTaskWithNewLog: (wordId: number, newTimeLog: TimeLogEntry[], timeLogTitle?: string) => void;
}

export function Checklist({ 
  sections, 
  onUpdate, 
  isEditable, 
  onComplete, 
  words, 
  setInboxMessages, 
  word, 
  wordId, 
  onWordUpdate, 
  checklistRef, 
  showToast, 
  focusItemId, 
  onFocusHandled, 
  settings, 
  onSettingsChange,
  handleGlobalToggleTimer,  
  handleClearActiveTimer,
  handlePrimeTask,
  handlePrimeTaskWithNewLog,
  activeTimerEntry,
  activeTimerLiveTime
}: ChecklistProps) {
  const [newItemTexts, setNewItemTexts] = useState<{ [key: number]: string }>({});
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [editingResponseForItemId, setEditingResponseForItemId] = useState<number | null>(null);
  const [editingNoteForItemId, setEditingNoteForItemId] = useState<number | null>(null);
  const [focusSubInputKey, setFocusSubInputKey] = useState<string | null>(null);
  const subInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});
  const [hiddenNotesSections, setHiddenNotesSections] = useState<Set<number>>(new Set());
  const [hiddenResponsesSections, setHiddenResponsesSections] = useState<Set<number>>(new Set());
  const [confirmingDeleteSectionNotes, setConfirmingDeleteSectionNotes] = useState<number | null>(null);
  const [confirmingDeleteSectionResponses, setConfirmingDeleteSectionResponses] = useState<number | null>(null);
  const [confirmingDeleteNotes, setConfirmingDeleteNotes] = useState(false);
  const [confirmingDeleteAllSections, setConfirmingDeleteAllSections] = useState(false);
  const [confirmingDeleteResponses, setConfirmingDeleteResponses] = useState(false);
  const [confirmingDeleteSectionId, setConfirmingDeleteSectionId] = useState<number | null>(null);
  const [confirmingDeleteChecked, setConfirmingDeleteChecked] = useState<number | 'all' | null>(null);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addItemInputRef = useRef<{ [key: number]: HTMLTextAreaElement }>({});
  const [bulkAddChecklistText, setBulkAddChecklistText] = useState('');
  const [isSaveTemplatePromptOpen, setIsSaveTemplatePromptOpen] = useState(false);
  const [templateSectionsToSave, setTemplateSectionsToSave] = useState<ChecklistSection[] | null>(null);
  const [isManageTemplatesOpen, setIsManageTemplatesOpen] = useState(false);

  // State for local undo/redo history of checklist changes
  const [history, setHistory] = useState<ChecklistSection[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoingRedoing = useRef(false); // Ref to prevent feedback loops
  const historyRef = useRef(history); // Create a ref to hold the live history
  historyRef.current = history; // Keep the ref updated on every render
  const editingItemInputRef = useRef<HTMLInputElement | null>(null);

  // Create a derived map of checklist item times from the single source of truth: word.timeLog
  const timeLogDurations = useMemo(() => {
    const durations = new Map<number, number>();
    if (!word.timeLog) return durations;

    for (const entry of word.timeLog) {
      if (entry.checklistItemId) {
        const currentDuration = durations.get(entry.checklistItemId) || 0;
        const isRunning = activeTimerEntry?.id === entry.id;
        const displayDuration = isRunning ? activeTimerLiveTime : entry.duration;
        durations.set(entry.checklistItemId, currentDuration + displayDuration);
      }
    }
    return durations;
  }, [word.timeLog, activeTimerEntry, activeTimerLiveTime]);

  // Data Migration: Handle old format (ChecklistItem[]) and convert to new format (ChecklistSection[])
  const normalizedSections: ChecklistSection[] = React.useMemo(() => {
    if (!sections || sections.length === 0) { 
      return [];
    }
    // Check if the first element is a ChecklistItem (old format)
    if ('isCompleted' in sections[0]) {
      return [{ id: 1, title: 'Checklist', items: sections as ChecklistItem[] }];
    }
    return sections as ChecklistSection[];
  }, [sections]);

  // Initialize history when sections are loaded
  useEffect(() => {
    setHistory([normalizedSections]);
    setHistoryIndex(0);
  }, [wordId]); // Re-initialize history only when the task itself changes

  const handleSendAllItemsToTimer = (startImmediately: boolean) => {
    const allSections = history[historyIndex];
    if (!allSections || allSections.length === 0) {
      showToast('Checklist is empty.');
      return;
    }

    const newTimeLogEntries: TimeLogEntry[] = [];

    // Create a set of item IDs that will be added to the timer
    const itemIdsToAdd = new Set<number>();
    allSections.forEach(section => {
      section.items.forEach(item => {
        if (!item.isCompleted) {
          itemIdsToAdd.add(item.id);
        }
      });
    });


    allSections.forEach(section => {
      // Add a header entry for the section, but only if it has items to add
      const itemsToAdd = section.items.filter(item => !item.isCompleted);
      if (itemsToAdd.length > 0) {
        newTimeLogEntries.push({
          id: section.id + Math.random(),
          description: section.title,
          duration: 0,
          type: 'header',
        });

        // Add all non-completed items from that section as regular entries
        itemsToAdd.forEach(item => {
          newTimeLogEntries.push({
            id: item.id + Math.random(),
            description: item.text,
            duration: item.loggedTime || 0, // Use existing logged time
            type: 'entry',
            checklistItemId: item.id, // Add the link back to the checklist item
            isRunning: false,
            createdAt: Date.now(),
          });
        });
      }
    });

    if (newTimeLogEntries.filter(e => e.type === 'entry').length === 0) {
      showToast('No active checklist items to send to timer.');
      return;
    }
    
    // Update the checklist items to ensure they have a loggedTime property
    const updatedSections = allSections.map(section => ({
      ...section,
      items: section.items.map(item => 
        itemIdsToAdd.has(item.id) && item.loggedTime === undefined
          ? { ...item, loggedTime: 0 }
          : item
      )
    }));

    if (startImmediately) {
      const firstEntry = newTimeLogEntries.find(e => e.type === 'entry');
      if (firstEntry) {
        // Pass the new log AND the entry to start in a single, atomic operation.
        setTimeout(() => handleGlobalToggleTimer(word.id, firstEntry.id, firstEntry, newTimeLogEntries), 100);
        // The checklist state is updated via the global timer handler, so we only need to update history here.
        updateHistory(updatedSections);
      }
    } else {
      // Use the correct handler to prime the task without starting the timer.
      handlePrimeTaskWithNewLog(word.id, newTimeLogEntries, word.text);
      updateHistory(updatedSections);
    }
    showToast('Checklist sent to Work Timer!');
  };

  const handleSendSectionToTimer = (section: ChecklistSection, startImmediately: boolean) => {
    const itemsToSend = section.items.filter(item => !item.isCompleted);
    if (itemsToSend.length === 0) {
      showToast('No active items in this section to send to timer.');
      return;
    }

    const newTimeLogEntries: TimeLogEntry[] = [
      // Add the section header first
      {
        id: section.id + Math.random(),
        description: section.title,
        duration: 0,
        type: 'header',
      },
      // Then add all the items from that section
      ...itemsToSend.map(item => ({ id: item.id + Math.random(), description: item.text, duration: item.loggedTime || 0, type: 'entry' as 'entry', isRunning: false, createdAt: Date.now(), checklistItemId: item.id }))
    ];

    if (startImmediately) {
      const firstEntry = newTimeLogEntries.find(e => e.type === 'entry');
      if (firstEntry) {
        // Pass the new log AND the entry to start in a single, atomic operation.
        setTimeout(() => handleGlobalToggleTimer(word.id, firstEntry.id, firstEntry, newTimeLogEntries), 100);
        // The global timer handler will update the checklist, so we just update local history and notify the parent.
        const updatedSections = history[historyIndex].map(s => s.id === section.id ? { ...s, items: s.items.map(i => itemsToSend.find(it => it.id === i.id) && i.loggedTime === undefined ? { ...i, loggedTime: 0 } : i) } : s);
        updateHistory(updatedSections);
        onUpdate(updatedSections);
      }
    } else {
      // Use the correct handler to prime the task without starting the timer.
      const updatedSections = history[historyIndex].map(s => s.id === section.id ? { ...s, items: s.items.map(i => itemsToSend.find(it => it.id === i.id) && i.loggedTime === undefined ? { ...i, loggedTime: 0 } : i) } : s);
      handlePrimeTaskWithNewLog(word.id, newTimeLogEntries, section.title);
      updateHistory(updatedSections);
    }
    showToast(`${itemsToSend.length} item(s) sent to timer!`);
  };

  const handleSendToTimer = (item: ChecklistItem, startImmediately: boolean) => {
    const newEntry: TimeLogEntry = {
      id: Date.now() + Math.random(),
      description: item.text,
      duration: item.loggedTime || 0, // Use existing logged time
      checklistItemId: item.id,
      type: 'entry',
      createdAt: Date.now(),
    };

    // Ensure the checklist item itself has its loggedTime initialized
    const updatedSections = history[historyIndex].map(section => ({
      ...section,
      items: section.items.map(i => 
        i.id === item.id && i.loggedTime === undefined 
          ? { ...i, loggedTime: 0 } 
          : i
      )
    }));

    if (startImmediately) {
      // For starting immediately, we create the new log by appending the entry
      // and pass it all to the atomic handler.
      const newTimeLog = [...(word.timeLog || []), newEntry];
      setTimeout(() => handleGlobalToggleTimer(wordId, newEntry.id, newEntry, newTimeLog), 100);
    } else {
      // For just adding without starting, a simple update is sufficient and correct.
      onWordUpdate({ ...word, timeLog: [...(word.timeLog || []), newEntry] });
    }
    updateHistory(updatedSections);
    onUpdate(updatedSections);
    showToast(`'${item.text}' sent to timer!`);
  };

  useEffect(() => {
    // This effect now specifically focuses the input whose key is stored in `focusSubInputKey`.
    if (isEditable && focusSubInputKey && subInputRefs.current[focusSubInputKey]) {
      subInputRefs.current[focusSubInputKey].focus();
      // Reset the focus request after it's been handled.
      setFocusSubInputKey(null);
    }
  }, [isEditable, normalizedSections, focusSubInputKey]);
  const updateHistory = (newSections: ChecklistSection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newSections]);
    setHistoryIndex(newHistory.length);
  };

  const handleToggleSectionNotes = (sectionId: number) => {
    setHiddenNotesSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleToggleSectionResponses = (sectionId: number) => {
    setHiddenResponsesSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) newSet.delete(sectionId);
      else newSet.add(sectionId);
      return newSet;
    });
  };
  useEffect(() => {
    if (focusItemId && editingItemId === focusItemId && editingItemInputRef.current) {
      editingItemInputRef.current.focus();
      // Once focused, notify the parent to clear the focus request
      onFocusHandled();
    }
  }, [editingItemId, focusItemId, onFocusHandled]);

  const handleUpdateItemText = (sectionId: number, itemId: number, newText: string) => {
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, text: newText } : item) } : sec);
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const handleUpdateItemResponse = (sectionId: number, itemId: number, newResponse: string) => {
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, response: newResponse } : item) } : sec);
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleUpdateItemNote = (sectionId: number, itemId: number, newNote: string) => {
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, note: newNote } : item) } : sec);
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleDeleteItemResponse = (sectionId: number, itemId: number) => {
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, response: undefined } : item) } : sec);
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleDeleteItemNote = (sectionId: number, itemId: number) => {
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, note: undefined } : item) } : sec);
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleUpdateItemDueDate = (sectionId: number, itemId: number, newDueDate: number | undefined) => {
    const newSections = history[historyIndex].map(sec =>
      sec.id === sectionId
        ? { ...sec, items: sec.items.map(item => (item.id === itemId ? { ...item, dueDate: newDueDate } : item)) }
        : sec,
    );
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleUpdateItemDueDateFromPicker = (sectionId: number, itemId: number, dateString: string) => {
    const newDueDate = dateString ? new Date(dateString + 'T00:00:00').getTime() : undefined;
    const newSections = history[historyIndex].map(sec =>
      sec.id === sectionId ? { ...sec, items: sec.items.map(item => (item.id === itemId ? { ...item, dueDate: newDueDate } : item)) } : sec
    );
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleAddSection = () => {
    const newId = Date.now();
    const newSection: ChecklistSection = {
      id: newId,
      title: 'New Section',
      items: [],
    };
    const newSections = [...history[historyIndex], newSection];
    updateHistory(newSections);
    onUpdate(newSections);
    setEditingSectionId(newId); // Set the new section to be in edit mode
    setEditingSectionTitle('New Section'); // Initialize the input with the default title
  };

  const handleUpdateSectionTitle = (sectionId: number, newTitle: string) => {
    const newSections = history[historyIndex].map(sec => 
      sec.id === sectionId ? { ...sec, title: newTitle } : sec
    );
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };
  const handleDuplicateSection = (sectionId: number) => {
    const currentSections = history[historyIndex];
    const sectionIndex = currentSections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    const sectionToDuplicate = currentSections[sectionIndex];
    const newDuplicatedSection: ChecklistSection = {
      ...sectionToDuplicate,
      id: Date.now() + Math.random(), // Use random to be safe
      title: `${sectionToDuplicate.title} (Copy)`,
      // CRITICAL FIX: Give all duplicated items new, unique IDs
      items: sectionToDuplicate.items.map(item => ({ ...item, id: Date.now() + Math.random() })),
    };

    const newSections = [...currentSections];
    newSections.splice(sectionIndex + 1, 0, newDuplicatedSection);

    updateHistory(newSections);
    onUpdate(newSections);
    showToast('Section Duplicated!');
    // Set the new section to be in edit mode immediately
    setEditingSectionId(newDuplicatedSection.id);
    setEditingSectionTitle(newDuplicatedSection.title);
  };

  const handleDeleteSection = (sectionId: number) => {        
    const newSections = history[historyIndex].filter(sec => sec.id !== sectionId);
    updateHistory(newSections);
    onUpdate(newSections);
    setConfirmingDeleteSectionId(null); // Reset confirmation state
    showToast('Section Deleted!');      
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
    }    
  };
  const handleDeleteAllSections = () => {
    if (confirmingDeleteAllSections) {
      updateHistory([]);
      onUpdate([]);
      showToast('All sections deleted.');
      setConfirmingDeleteAllSections(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteAllSections(true);
      // Reset other confirmations
      setConfirmingDeleteSectionId(null);
      setConfirmingDeleteNotes(false);
      setConfirmingDeleteResponses(false);
      setConfirmingDeleteSectionNotes(null);
      setConfirmingDeleteSectionResponses(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAllSections(false), 3000);
    }
  };

  const handleBulkAddChecklist = () => {
    if (!bulkAddChecklistText.trim()) return;

    const sectionsToAdd: ChecklistSection[] = [];
    let currentSection: ChecklistSection | null = null;

    const lines = bulkAddChecklistText.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('###')) {
        // If there's an existing section, push it before starting a new one.
        if (currentSection) {
          sectionsToAdd.push(currentSection);
        }
        currentSection = {
          id: Date.now() + Math.random(),
          title: trimmedLine.substring(3).trim(),
          items: [],
        };
      } else if (trimmedLine === '---' && currentSection) {
        sectionsToAdd.push(currentSection);
        currentSection = null;
      } else if (trimmedLine && currentSection) {
        currentSection.items.push({
          id: Date.now() + Math.random(),
          text: trimmedLine,
          isCompleted: false,
        });
      }
    }
    if (currentSection) sectionsToAdd.push(currentSection);
    const newSections = [...history[historyIndex], ...sectionsToAdd];
    updateHistory(newSections);
    onUpdate(newSections);
    setBulkAddChecklistText(''); // Clear the input
    showToast(`${sectionsToAdd.length} section(s) added!`);
  };
  
  const handleLoadChecklistTemplate = (templateId: number) => {
    if (!templateId) return;

    const template = settings.checklistTemplates?.find(t => t.id === templateId);
    if (!template) {
      showToast('Template not found.');
      return;
    }

    // Deep copy the template sections and assign new unique IDs
    const newSectionsFromTemplate: ChecklistSection[] = template.sections.map(section => ({
      ...section,
      id: Date.now() + Math.random(), // New unique ID for the section
      items: section.items.map(item => ({
        ...item,
        id: Date.now() + Math.random(), // New unique ID for the item
        isCompleted: false, // Always add items as not completed
      }))
    }));

    const newSections = [...history[historyIndex], ...newSectionsFromTemplate];
    updateHistory(newSections);
    onUpdate(newSections);
    showToast(`Template "${template.name}" loaded!`);
  };

  const handleSaveChecklistTemplate = (templateName: string) => {
    if (!templateName.trim() || !templateSectionsToSave) return;

    const newTemplate: ChecklistTemplate = {
      id: Date.now(),
      name: templateName.trim(),
      sections: templateSectionsToSave,
    };

    onSettingsChange(prevSettings => ({
      ...prevSettings,
      checklistTemplates: [...(prevSettings.checklistTemplates || []), newTemplate],
    }));

    showToast(`Template "${templateName.trim()}" saved!`);
    setIsSaveTemplatePromptOpen(false);
    setTemplateSectionsToSave(null);
  };

  const handleAddItem = (sectionId: number) => {
    const text = newItemTexts[sectionId] || '';
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    if (lines.length === 0) return;

    const newItems: ChecklistItem[] = lines.map((line, index) => ({
      id: Date.now() + Math.random(), // Use Math.random() to guarantee a unique ID
      text: line,
      isCompleted: false,
    }));

    const newSections = history[historyIndex].map(sec =>
      sec.id === sectionId ? { ...sec, items: [...sec.items, ...newItems] } : sec
    );

    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
    setNewItemTexts(prev => ({ ...prev, [sectionId]: '' })); // Clear only this section's input

    // Focus the input after adding items
    setTimeout(() => {
      addItemInputRef.current[sectionId]?.focus();
    }, 0);
  };

  const handleToggleItem = (sectionId: number, itemId: number) => {
    let toggledItem: ChecklistItem | null = null;
    const newSections = history[historyIndex].map(sec => {
      if (sec.id !== sectionId) return sec;
  
      const newItems = sec.items.map(item => {
        if (item.id !== itemId) return item;
  
        // If we are un-checking an item, we should NOT clear its logged time.
        // The time should only be cleared manually if desired.
        const isNowCompleted = !item.isCompleted;

        // If the item is being marked as complete, send a notification.
        if (isNowCompleted) {
          toggledItem = item; // Store the item that was toggled
        }
        return { ...item, isCompleted: isNowCompleted };
      });
      return { ...sec, items: newItems };
    });

    // Now that newSections is fully initialized, we can safely use it.
    if (toggledItem) {
      onComplete(toggledItem, sectionId, newSections);
    }

    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const moveSection = (sections: ChecklistSection[], sectionId: number, direction: 'up' | 'down'): ChecklistSection[] => {
    const newSections = [...sections];
    const index = newSections.findIndex(s => s.id === sectionId);
    if (direction === 'up' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    }
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    return newSections;
  };

  const handleCompleteAllInSection = (sectionId: number) => {
    const sectionToUpdate = history[historyIndex].find(sec => sec.id === sectionId);
    if (!sectionToUpdate) return;

    const areAllCurrentlyCompleted = sectionToUpdate.items.every(item => item.isCompleted);

    // If un-checking all, just update state and return.
    if (!areAllCurrentlyCompleted) {
      // Send notifications for each item that is about to be completed.
      sectionToUpdate.items.forEach(item => {
        if (!item.isCompleted) {
          onComplete(item, sectionId, []); // Pass empty array as updatedSections is not needed here.
        }
      });

      // Send the single "Section Completed" notification.
      const parentWord = words.find((w: Word) => w.checklist?.some((s: any) => 'items' in s && s.id === sectionId)); 
      if (parentWord) {
        setInboxMessages((prev: InboxMessage[]) => [{ id: Date.now() + Math.random(), type: 'completed', text: `Section completed: "${sectionToUpdate.title}" in task "${parentWord.text}"`, timestamp: Date.now(), wordId: parentWord.id, sectionId: sectionId }, ...prev]);
      }
    }

    // Finally, update the state to toggle all items.
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(i => ({ ...i, isCompleted: !areAllCurrentlyCompleted })) } : sec);
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };  
  
  const handleToggleAllSections = () => {
    const allItems = history[historyIndex].flatMap(sec => sec.items);
    if (allItems.length === 0) return;

    const areAllItemsComplete = allItems.every(item => item.isCompleted);

    const newSections = history[historyIndex].map(sec => ({
      ...sec,
      items: sec.items.map(item => {
        // If we are completing all, and this item isn't complete yet, send a notification
        if (!areAllItemsComplete && !item.isCompleted) {
          onComplete(item, sec.id, []);
        }
        return { ...item, isCompleted: !areAllItemsComplete };
      })
    }));
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const handleDeleteChecked = (sectionId?: number) => {
    const confirmKey = sectionId === undefined ? 'all' : sectionId;
    if (confirmingDeleteChecked === confirmKey) {
      const newSections = history[historyIndex].map(sec =>
        (sectionId === undefined || sec.id === sectionId)
          ? { ...sec, items: sec.items.filter(item => !item.isCompleted) }
          : sec
      );
      updateHistory(newSections);
      onUpdate(newSections);
      showToast('Checked items deleted.');
      setConfirmingDeleteChecked(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteChecked(confirmKey);
      // Reset other confirmations to avoid confusion
      setConfirmingDeleteSectionId(null);
      setConfirmingDeleteNotes(false);
      setConfirmingDeleteResponses(false);
      setConfirmingDeleteSectionNotes(null);
      setConfirmingDeleteSectionResponses(null);
      setConfirmingDeleteAllSections(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteChecked(null), 3000);
    }

  };

  const handleDeleteItem = (sectionId: number, itemId: number) => {
    const newSections = history[historyIndex].map(sec => {
      if (sec.id === sectionId) {
        const newItems = sec.items.filter(item => item.id !== itemId);
        return { ...sec, items: newItems };
      }
      return sec;
    });
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoingRedoing.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      // Find the parent word and update it with the historical checklist state
      onUpdate(history[newIndex]);
      setTimeout(() => isUndoingRedoing.current = false, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoingRedoing.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      // Find the parent word and update it with the historical checklist state
      onUpdate(history[newIndex]);
      setTimeout(() => isUndoingRedoing.current = false, 0);
    }
  };

  // Expose undo/redo functions via the passed-in ref
  if (checklistRef) {
    checklistRef.current = {
      handleUndo,      
      handleRedo,      
      resetHistory: (sections: ChecklistSection[]) => {        
        isUndoingRedoing.current = true;        
        setHistory([sections]);        
        setHistoryIndex(0);        
        setTimeout(() => isUndoingRedoing.current = false, 0);      
      },
    };
  }

  const handleToggleSectionCollapse = React.useCallback((sectionId: number) => {
    const openIds = settings.openChecklistSectionIds || [];
    const isOpen = openIds.includes(sectionId);
    const newOpenIds = isOpen
      ? openIds.filter(id => id !== sectionId)
      : [...openIds, sectionId];
    // CRITICAL FIX: Use the functional update form to merge the change
    // instead of replacing the entire settings object.
    onSettingsChange(prevSettings => ({ ...prevSettings, openChecklistSectionIds: newOpenIds }));
  }, [settings.openChecklistSectionIds, onSettingsChange]);

  const handleCollapseAllSections = React.useCallback(() => {
    onSettingsChange(prev => ({ ...prev, openChecklistSectionIds: [] }));
  }, [onSettingsChange]);

  const handleExpandAllSections = React.useCallback(() => {
    const allSectionIds = historyRef.current[historyIndex].map(s => s.id);
    onSettingsChange(prev => ({ ...prev, openChecklistSectionIds: allSectionIds }));
  }, [historyIndex, onSettingsChange]);

  const handleAddNotes = React.useCallback((sectionId?: number) => {
    const newSections = history[historyIndex].map(sec => {
      if (sectionId && sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items.map(item => 
          item.note === undefined ? { ...item, note: '' } : item
        )
      };
    });
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('Note fields added!');
  }, [history, historyIndex, onUpdate, showToast]);

  const handleAddResponses = React.useCallback((sectionId?: number) => {
    const newSections = history[historyIndex].map(sec => {
      if (sectionId && sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items.map(item => 
          item.response === undefined ? { ...item, response: '' } : item
        )
      };
    });
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('Response fields added!');
  }, [history, historyIndex, onUpdate, showToast]);

  const handleDeleteAllResponses = () => {
    const newSections = history[historyIndex].map(sec => ({
      ...sec,
      items: sec.items.map(item => {
        const { response, ...rest } = item;
        return rest;
      })
    }));
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('All Response deleted!');
  };


  const handleDeleteAllNotes = () => {
    const newSections = history[historyIndex].map(sec => ({
      ...sec,
      items: sec.items.map(item => {
        const { note, ...rest } = item;
        return rest;
      })
    }));
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('All Notes deleted!');
  };

  const handleDeleteAllSectionResponses = (sectionId: number) => {
    const newSections = history[historyIndex].map(sec => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items.map(item => {
          const { response, ...rest } = item;
          return rest;
        })
      };
    });
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('Section Responses deleted!');
  };

  const handleDeleteAllSectionNotes = (sectionId: number) => {
    const newSections = history[historyIndex].map(sec => {
      if (sec.id !== sectionId) return sec;
      return { ...sec, items: sec.items.map(item => { const { note, ...rest } = item; return rest; }) };
    });
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('Section Notes deleted!');
  };

  const handleDuplicateChecklistItem = (sectionId: number, itemId: number) => {
    const currentSections = history[historyIndex];
    const section = currentSections.find(s => s.id === sectionId);
    if (!section) return;
    const itemIndex = section.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    const itemToDuplicate = section.items[itemIndex];
    const duplicatedItem = { ...itemToDuplicate, id: Date.now() + Math.random(), text: `${itemToDuplicate.text} (Copy)` };
    const newItems = [...section.items];
    newItems.splice(itemIndex + 1, 0, duplicatedItem);
    const newSections = currentSections.map(s => s.id === sectionId ? { ...s, items: newItems } : s);
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('Item duplicated!');
    // Set the newly created item to be in edit mode immediately.
    setEditingItemId(duplicatedItem.id);
    setEditingItemText(duplicatedItem.text);
  };
  // Effect to handle commands from the context menu that require local state changes
  const handleGlobalChecklistCommand = useCallback((payload: { command: string }) => {
    // This handler is for commands that DON'T need a sectionId.
    switch (payload.command) {               
      case 'expand_all_header ': handleExpandAllSections(); break;
      case 'expand_all_section': handleExpandAllSections(); break;
      case 'collapse_all': handleCollapseAllSections(); break;
      case 'add_note_to_all': handleAddNotes(); break;
      case 'add_response_to_all': handleAddResponses(); break;
      case 'delete_all_notes': handleDeleteAllNotes(); break;
      case 'delete_all_responses': handleDeleteAllResponses(); break;
      case 'delete_all_sections': handleDeleteAllSections(); break;
      case 'send_all_to_timer': handleSendAllItemsToTimer(false); break;
      case 'send_all_to_timer_and_start': handleSendAllItemsToTimer(true); break;
      case 'copy_all_sections': {
        const textToCopy = formatChecklistForCopy(history[historyIndex]);
        navigator.clipboard.writeText(textToCopy);
        showToast('All sections copied to clipboard!');
        break;
      }
      case 'copy_all_sections_raw': {
        const allRawText = history[historyIndex].map(section => {
          const header = `### ${section.title}`;
          const itemsText = section.items.map(item => item.text).join('\n');
          return `${header}\n${itemsText}`;
        }).join('\n---\n');
        navigator.clipboard.writeText(allRawText);
        showToast('All sections raw content copied!');
        break;
      }
      case 'save_checklist_as_template': {
        setTemplateSectionsToSave(history[historyIndex]);
        setIsSaveTemplatePromptOpen(true);
        break;
      }
      // No 'clear_all_highlights' here, as it's handled in the section-specific command
    }
  }, [history, historyIndex, handleExpandAllSections, handleCollapseAllSections, handleAddNotes, handleAddResponses, handleDeleteAllNotes, handleDeleteAllResponses, handleDeleteAllSections, handleSendAllItemsToTimer, showToast, setTemplateSectionsToSave, setIsSaveTemplatePromptOpen]);

  useEffect(() => {
    const handleChecklistCommand = (payload: { command: string, sectionId: number, itemId: number, color?: string }) => {
      const { command, sectionId, itemId, color } = payload;
      const currentSections = history[historyIndex];
      const section = currentSections.find(s => s.id === sectionId);
      if (!section) return;

      const itemIndex = section.items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return;

      let newItems = [...section.items];
      let newSections = [...currentSections];

      switch (command) {
        case 'toggle_complete': {
          let toggledItem: ChecklistItem | null = null;
          newItems = newItems.map(item => {
            if (item.id !== itemId) return item;
            const isNowCompleted = !item.isCompleted;
            if (isNowCompleted) toggledItem = item;
            return { ...item, isCompleted: isNowCompleted };
          });
          if (toggledItem) onComplete(toggledItem, sectionId, [{ ...section, items: newItems }]);
          break;
        }
        case 'delete':
          newItems.splice(itemIndex, 1);
          break;
        case 'copy':
          navigator.clipboard.writeText(newItems[itemIndex].text);
          showToast('Checklist item copied!');
          return; // No state update needed
        case 'duplicate': {
          handleDuplicateChecklistItem(sectionId, itemId);
          break;
        }
        case 'add_before':
          newItems.splice(itemIndex, 0, { id: Date.now() + Math.random(), text: 'New Item', isCompleted: false });
          break;
        case 'add_after':
          newItems.splice(itemIndex + 1, 0, { id: Date.now() + Math.random(), text: 'New Item', isCompleted: false });
          break;
        case 'move_up':
          if (itemIndex > 0) {
            [newItems[itemIndex - 1], newItems[itemIndex]] = [newItems[itemIndex], newItems[itemIndex - 1]];
          }
          break;
        case 'move_down':
          if (itemIndex < newItems.length - 1) {
            [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
          }
          break;
        case 'highlight':
          newSections = newSections.map(s =>
            s.id === sectionId
              ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, highlightColor: color } : i) }
              : s
          );
          break;
        case 'delete_note':
        case 'delete_response': {
          const fieldToClear = command === 'delete_note' ? 'note' : 'response';
          newSections = newSections.map(s => s.id === sectionId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, [fieldToClear]: undefined } : i) } : s);
          showToast(`${fieldToClear.charAt(0).toUpperCase() + fieldToClear.slice(1)} deleted.`);
          break;
        }
      }
      if (command === 'open_link') {
        const item = section.items.find(i => i.id === itemId);
        if (item) {
          const url = extractUrlFromText(item.text);
          if (url) window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
        }
        return; // No state update needed
      } else if (command === 'copy_link') {
        const item = section.items.find(i => i.id === itemId);
        if (item) {
          const url = extractUrlFromText(item.text);
          if (url) {
            navigator.clipboard.writeText(url);
            showToast('Link copied!');
          }
        }
        return; // No state update needed
      } else if (command === 'copy_note') {
        const item = section.items.find(i => i.id === itemId);
        if (item?.note) {
          navigator.clipboard.writeText(item.note);
          showToast('Note copied!');
        }
        return; // No state update needed
      } else if (command === 'open_note_link' || command === 'copy_note_link') {
        const item = section.items.find(i => i.id === itemId);
        if (item?.note) {
          const url = extractUrlFromText(item.note);
          if (url) {
            if (command === 'open_note_link') window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
            else { navigator.clipboard.writeText(url); showToast('Link copied from note!'); }
          }
        }
        return; // No state update needed
      } else if (command === 'copy_response') {
        const item = section.items.find(i => i.id === itemId);
        if (item?.response) {
          navigator.clipboard.writeText(item.response);
          showToast('Response copied!');
        }
        return; // No state update needed
      } else if (command === 'open_response_link' || command === 'copy_response_link') {
        const item = section.items.find(i => i.id === itemId);
        if (item?.response) {
          const url = extractUrlFromText(item.response);
          if (url) {
            if (command === 'open_response_link') window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
            else { navigator.clipboard.writeText(url); showToast('Link copied from response!'); }
          }
        }
        return; // No state update needed
      }

      if (!['highlight', 'delete_note', 'delete_response'].includes(command)) {
        newSections = newSections.map(s => s.id === sectionId ? { ...s, items: newItems } : s);
      }
      
      updateHistory(newSections); // This is the key: update local history
      onUpdate(newSections); // AND call the parent update function

      if (payload.command === 'edit') {
        const section = history[historyIndex].find(s => s.id === payload.sectionId);
        const item = section?.items.find(i => i.id === payload.itemId);
        if (item) {
          setEditingItemId(item.id);
          setEditingItemText(item.text);
        }
      } else if (payload.command === 'edit_response') {
        const section = history[historyIndex].find(s => s.id === payload.sectionId);
        const item = section?.items.find(i => i.id === payload.itemId);
        if (item) {          
          if (item.response === undefined) handleUpdateItemResponse(payload.sectionId, payload.itemId, '');
          setEditingResponseForItemId(payload.itemId);
        }
      } else if (payload.command === 'edit_note') {
        const section = history[historyIndex].find(s => s.id === payload.sectionId);
        const item = section?.items.find(i => i.id === payload.itemId);
        if (item) {          
          if (item.note === undefined) handleUpdateItemNote(payload.sectionId, payload.itemId, '');
          setEditingNoteForItemId(payload.itemId);
        }
      } else if (command === 'send_to_timer') {
        const item = section.items.find(i => i.id === itemId);
        if (item) handleSendToTimer(item, false);
      } else if (command === 'send_to_timer_and_start') {
        const item = section.items.find(i => i.id === itemId);
        if (item) handleSendToTimer(item, true);
      } else if (command === 'view' && wordId) {
        onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [wordId]: 'ticket' } });
        if (!settings.openAccordionIds.includes(wordId)) onSettingsChange({ openAccordionIds: [...new Set([...settings.openAccordionIds, wordId])] });
      }
    };
    const handleSectionCommand = (payload: { command: string, sectionId?: number }) => {
      const { command, sectionId } = payload;
      // This handler is now ONLY for commands that require a sectionId.
      if (!sectionId) return;

      switch (command) {
        case 'move_section_up':
          onUpdate(moveSection(history[historyIndex], sectionId, 'up'));
          break;
        case 'move_section_down':
          onUpdate(moveSection(history[historyIndex], sectionId, 'down'));
          break;
        case 'undo_checklist':
          handleUndo();
          break;
        case 'redo_checklist':
          handleRedo();
          break;
        case 'edit_title': {
          const section = history[historyIndex].find(s => s.id === sectionId);
          if (section) {
            setEditingSectionId(section.id);
            setEditingSectionTitle(section.title);
          }
          break;
        }
        case 'toggle_all_in_section':
          handleCompleteAllInSection(sectionId);
          break;
        case 'toggle_collapse': handleToggleSectionCollapse(sectionId); break;
        case 'add_note_to_section': handleAddNotes(sectionId); break;
        case 'add_response_to_section': handleAddResponses(sectionId); break;
        case 'toggle_section_notes':
          handleToggleSectionNotes(sectionId);
          break;
        case 'toggle_section_responses':
          handleToggleSectionResponses(sectionId);
          break;
        case 'copy_section': {
          const sectionToCopy = history[historyIndex].find(s => s.id === sectionId);
          if (sectionToCopy) {
            const textToCopy = formatChecklistForCopy([sectionToCopy]);
            navigator.clipboard.writeText(textToCopy);
            showToast('Section copied to clipboard!');
          }
          break; 
        }
        case 'copy_section_raw': {
          const sectionToCopy = history[historyIndex].find(s => s.id === sectionId);
          if (sectionToCopy) {
            const header = `### ${sectionToCopy.title}`;
            const itemsText = sectionToCopy.items.map(item => item.text).join('\n');
            const textToCopy = `${header}\n${itemsText}`;
            navigator.clipboard.writeText(textToCopy);
            showToast('Section raw content copied!');            
          }
          break;
        }
        case 'clear_all_highlights': {
          if (sectionId) {
            const newSections = history[historyIndex].map(sec => 
              sec.id === sectionId 
                ? { ...sec, items: sec.items.map(item => ({ ...item, highlightColor: undefined } as ChecklistItem)) }
                : sec
            );
            updateHistory(newSections);
            onUpdate(newSections);
            showToast('Highlights cleared for section.');            
          }
          break;
        }
        case 'duplicate_section': {          
          handleDuplicateSection(sectionId);
          break;
        }
        case 'delete_section': {
          handleDeleteSection(sectionId);
          break;
        }
        case 'send_section_to_timer': {          
          const section = history[historyIndex].find(s => s.id === sectionId);
          if (section) handleSendSectionToTimer(section, false);
          break;
        }
        case 'send_section_to_timer_and_start': {          
          const section = history[historyIndex].find(s => s.id === sectionId);
          if (section) handleSendSectionToTimer(section, true);
          break;
        }
        case 'save_section_as_template': {
          const sectionToSave = history[historyIndex].find(s => s.id === sectionId);
          if (sectionToSave) setTemplateSectionsToSave([sectionToSave]);
          setIsSaveTemplatePromptOpen(true);
          break;
        }
        case 'send_all_to_timer': {
          handleSendAllItemsToTimer(false);
          break;
        }
        case 'send_all_to_timer_and_start': {
          handleSendAllItemsToTimer(true);
          break;
        }
      }
    };

    const handleGlobalChecklistCommand = (payload: { command: string }) => {
      // This handler is for commands that DON'T need a sectionId.
      switch (payload.command) {               
        case 'expand_all_header ': handleExpandAllSections(); break;
        case 'clear_all_highlights': {
          const newSections = history[historyIndex].map(sec => ({
            ...sec,
            items: sec.items.map(item => ({ ...item, highlightColor: undefined } as ChecklistItem))
          }));
          updateHistory(newSections);
          onUpdate(newSections);
          showToast('All highlights cleared.');
          break;
        }
        default: break; // Do nothing for unhandled commands
      }
    };


    const handleMainHeaderCommand = (payload: { command: string, wordId?: number }) => {
      // This is a new, combined handler.
      // It first checks for task-level commands like 'view' and 'edit'.
      if (payload.command === 'view' && payload.wordId) {        
        onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [payload.wordId]: 'ticket' } });
        if (!settings.openAccordionIds.includes(payload.wordId)) {
          onSettingsChange({ openAccordionIds: [...new Set([...settings.openAccordionIds, payload.wordId])] });
        }
      } else if (payload.command === 'edit' && payload.wordId) {
        const targetWord = words.find(w => w.id === payload.wordId);
        if (targetWord && !targetWord.completedDuration) {
          onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [payload.wordId]: 'edit' }, openAccordionIds: [...new Set([...settings.openAccordionIds, payload.wordId])] });
        }
      } else {
        // If it's not 'view' or 'edit', it must be a section command.
        // We can pass it to the existing handler.
        handleGlobalChecklistCommand(payload);        
      }
    };

    // We listen for the generic command, but only act on 'edit'
    const cleanup = window.electronAPI.on('checklist-item-command', handleChecklistCommand);
    const cleanupSection = window.electronAPI.on('checklist-section-command', (payload) => { payload.sectionId ? handleSectionCommand(payload) : handleGlobalChecklistCommand(payload) });
    const cleanupMainHeader = window.electronAPI.on('checklist-main-header-command', handleMainHeaderCommand);
    
    return () => { 
      cleanup?.(); // This was missing the question mark
      cleanupSection?.();
      cleanupMainHeader?.();
    };
  }, [history, historyIndex, handleAddNotes, onUpdate, handleAddResponses, handleCollapseAllSections, handleExpandAllSections, handleToggleSectionCollapse, handleDeleteSection, handleDuplicateSection, handleUndo, handleRedo, onSettingsChange, settings, words, handleGlobalChecklistCommand]);

  return (
    <div className="checklist-container">
      <PromptModal
        isOpen={isSaveTemplatePromptOpen}
        onClose={() => setIsSaveTemplatePromptOpen(false)}
        onConfirm={handleSaveChecklistTemplate}
        title="Save as Template"
        placeholder="Enter template name..."
      />
      <div className="checklist-main-header" onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const isInEditMode = settings.activeTaskTabs?.[wordId] === 'edit';
        window.electronAPI.showChecklistMainHeaderContextMenu({
          wordId,
          sectionId: 0, // Not relevant for global commands
          areAllComplete: false, // Not relevant for global commands
          // Add the missing properties with dummy/global values
          isSectionOpen: false,
          isNotesHidden: !settings.showChecklistNotes,
          isResponsesHidden: !settings.showChecklistResponses,
          isConfirmingDelete: confirmingDeleteAllSections,
          isInEditMode,
          x: e.clientX, 
          y: e.clientY
        });
      }}>
        <h4>Checklist</h4>
        {(() => {
          const allItems = history[historyIndex].flatMap(sec => sec.items);
          if (allItems.length === 0) return null;
          const areAllItemsComplete = allItems.every(item => item.isCompleted);
          const anyItemsCompleted = allItems.some(item => item.isCompleted);
          return (
            <div className="checklist-section-actions checklist-main-header-actions">
              {anyItemsCompleted && (
                <>
                  <button className={`checklist-action-btn delete-btn ${confirmingDeleteChecked === 'all' ? 'confirm-delete' : ''}`} onClick={() => handleDeleteChecked()} title="Delete All Checked Items">
                    {confirmingDeleteChecked === 'all' ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}
                  </button>
                </>
              )}
              <button 
                onClick={handleToggleAllSections} 
                className="checklist-action-btn"
                title={areAllItemsComplete ? 'Re-Open All Items in All Sections' : 'Complete All Items in All Sections'}
              >
                <i className={`fas ${areAllItemsComplete ? 'fa-undo' : 'fa-check-square'}`}></i>
              </button>              
              <div className="checklist-action-group checklist-action-group-expand">
                <button 
                  className="checklist-action-btn" 
                  onClick={() => handleSendAllItemsToTimer(false)} 
                  title="Send All Items to Timer">
                  <i className="fas fa-stopwatch"></i>
                </button>
                <button
                  className="checklist-action-btn"
                  onClick={() => handleSendAllItemsToTimer(true)}
                  title="Send All Items to Timer and Start">
                  <i className="fas fa-play-circle"></i>
                </button>
                <button className="checklist-action-btn" onClick={handleExpandAllSections} title="Expand All Sections">
                  <i className="fas fa-folder-open"></i>
                </button>
                <button className="checklist-action-btn" onClick={handleCollapseAllSections} title="Collapse All Sections">
                  <i className="fas fa-folder"></i>
                </button>                         
              </div>
              <div className="checklist-action-group checklist-action-group-responses">
                <button className="checklist-action-btn" onClick={() => handleAddResponses()} title="Add Response to All Items">
                  <i className="fas fa-reply"></i>
                </button>
                <button 
                  className="checklist-action-btn" 
                  onClick={() => onSettingsChange(prev => ({ ...prev, showChecklistResponses: !prev.showChecklistResponses }))} title={settings.showChecklistResponses ? 'Hide All Responses' : 'Show All Responses'}>
                  <i className={`fas fa-eye ${settings.showChecklistResponses ? '' : 'disabled-icon'}`}></i>
                </button>
                <button className={`checklist-action-btn ${confirmingDeleteResponses ? 'confirm-delete' : ''}`} onClick={() => {
                  if (confirmingDeleteResponses) {
                    handleDeleteAllResponses();
                    setConfirmingDeleteResponses(false);
                    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                  } else {
                    setConfirmingDeleteResponses(true);
                    setConfirmingDeleteNotes(false); // Cancel other confirmation
                    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                    confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteResponses(false), 3000);
                  }
                }} title="Delete All Responses">
                  {confirmingDeleteResponses ? <i className="fas fas fa-trash-alt delete-icon"></i> : (                  
                    <i className="fas fas fa-trash-alt delete-icon"></i>                  
                  )}
                </button>
              </div>
              <div className="checklist-action-group checklist-action-group-notes">
                <button className="checklist-action-btn" onClick={() => handleAddNotes()} title="Add Note to All Items">
                  <i className="fas fa-sticky-note"></i>
                </button>                
                <button 
                  className="checklist-action-btn" 
                  onClick={() => onSettingsChange(prev => ({ ...prev, showChecklistNotes: !prev.showChecklistNotes }))} title={settings.showChecklistNotes ? 'Hide All Notes' : 'Show All Notes'}>
                  <i className={`fas fa-eye ${settings.showChecklistNotes ? '' : 'disabled-icon'}`}></i>
                </button>                   
                <button className={`checklist-action-btn ${confirmingDeleteNotes ? 'confirm-delete' : ''}`} onClick={() => {
                  if (confirmingDeleteNotes) {
                    handleDeleteAllNotes();
                    setConfirmingDeleteNotes(false);
                    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                  } else {
                    setConfirmingDeleteNotes(true);
                    setConfirmingDeleteResponses(false); // Cancel other confirmation
                    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                    confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteNotes(false), 3000);
                  }
                }} title="Delete All Notes">
                  {confirmingDeleteNotes ? <i className="fas fas fa-trash-alt delete-icon"></i> : (
                    <i className="fas fas fa-trash-alt delete-icon"></i>
                  )}
                </button>
              </div>                            
              <div className="checklist-action-group checklist-action-group-copy">
                <button className="checklist-action-btn" onClick={() => {
                  const textToCopy = formatChecklistForCopy(history[historyIndex]);
                  navigator.clipboard.writeText(textToCopy);
                  showToast('All sections copied to clipboard!');
                }} title="Copy All Sections">
                  <i className="fas fa-copy"></i>
                </button>
                <button className="checklist-action-btn" onClick={() => {
                  const allRawText = history[historyIndex].map(section => {
                    const header = `### ${section.title}`;
                    const itemsText = section.items.map(item => item.text).join('\n');
                    return `${header}\n${itemsText}`;
                  }).join('\n---\n');
                  navigator.clipboard.writeText(allRawText);
                  showToast('All sections raw content copied!');
                }} title="Copy All Sections Raw">
                  <i className="fas fa-paste"></i>
                </button>
                <button className="checklist-action-btn" onClick={() => handleGlobalChecklistCommand({ command: 'save_checklist_as_template' })} title="Save Checklist as Template">
                  <i className="fas fa-save"></i>
                </button>
              </div>
              <div className="checklist-action-group checklist-action-group-history">
                <button className="checklist-action-btn" onClick={handleUndo} disabled={historyIndex === 0} title="Undo Last Checklist Action">
                  <i className="fas fa-undo-alt"></i>
                </button>
                <button className="checklist-action-btn" onClick={handleRedo} disabled={historyIndex === history.length - 1} title="Redo Checklist Action">
                  <i className="fas fa-redo-alt"></i>
                </button>
              </div>
              {isEditable && (
                <>
                  <button onClick={handleDeleteAllSections} className={`add-section-btn checklist-delete-btn delete-btn ${confirmingDeleteAllSections ? 'confirm-delete' : ''}`} title="Delete All Sections">
                    {confirmingDeleteAllSections ? <i className="fas fas fa-trash-alt delete-icon color-red"></i> : <i className="fas fas fa-trash-alt delete-icon"></i>}
                  </button>
                </>
              )}                
            </div>
          );
        })()}
      </div>
      {history[historyIndex].map(section => {
        const completedCount = section.items.filter(item => item.isCompleted).length;
        const totalCount = section.items.length;
        const areAllComplete = totalCount > 0 && completedCount === totalCount;
        const isSectionOpen = (settings.openChecklistSectionIds || []).includes(section.id);
        const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        return (
          <div key={section.id} className="checklist-section" data-section-id={section.id} onContextMenu={(e) => {
              e.preventDefault(); 
              e.stopPropagation(); // Stop the event from bubbling up to the parent TaskAccordion
              const isInEditMode = settings.activeTaskTabs?.[wordId] === 'edit';
              window.electronAPI.showChecklistSectionContextMenu({ 
                wordId, 
                sectionId: section.id, 
                areAllComplete, 
                isSectionOpen, 
                isNotesHidden: hiddenNotesSections.has(section.id), 
                isResponsesHidden: hiddenResponsesSections.has(section.id),
                isConfirmingDelete: confirmingDeleteSectionId === section.id,
                isInEditMode, // This was the missing piece
                x: e.clientX, y: e.clientY }); 
            }}>
            <header className="checklist-section-header">
              <button 
                className="checklist-collapse-btn" 
                onClick={() => handleToggleSectionCollapse(section.id)}
                title={isSectionOpen ? 'Collapse Section' : 'Expand Section'}>
                <i className={`fas ${isSectionOpen ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
              </button>
              <div className="checklist-header">
                <div className="checklist-header-wrap">                            
                  {editingSectionId === section.id ? (
                    <input
                      type="text"
                      value={editingSectionTitle}
                      onChange={(e) => setEditingSectionTitle(e.target.value)}
                      onBlur={() => {
                        handleUpdateSectionTitle(section.id, editingSectionTitle);
                        setEditingSectionId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateSectionTitle(section.id, editingSectionTitle);
                          setEditingSectionId(null);
                        }
                      }}
                      onFocus={(e) => {
                        // Automatically select the text when the input is focused
                        e.target.select();
                      }}
                      autoFocus
                      className="checklist-section-title-input"
                    />
                  ) : (
                    <>
                      <h3
                        className={'editable-title'}
                        title="Double-click to edit"
                        onDoubleClick={() => { setEditingSectionId(section.id); setEditingSectionTitle(section.title); }}
                      >
                        {section.title} ({completedCount}/{totalCount})
                      </h3> 
                      {hiddenNotesSections.has(section.id) && (
                        <span className="hidden-indicator" title="Notes are hidden in this section">
                          <i className="fas fa-sticky-note disabled-icon"></i>
                        </span>
                      )}
                      {hiddenResponsesSections.has(section.id) && (
                        <span className="hidden-indicator" title="Responses are hidden in this section">
                          <i className="fas fa-reply disabled-icon"></i>
                        </span>
                      )}
                    </>
                  )}
                  {totalCount > 0 && (
                    <span className="checklist-progress">
                      ({completedCount}/{totalCount} completed)
                    </span>
                  )}
                </div>
                <div className="checklist-section-actions checklist-section-header-actions">
                  {completedCount > 0 && (
                    <button className={`checklist-action-btn delete-btn ${confirmingDeleteChecked === section.id ? 'confirm-delete' : ''}`} onClick={() => handleDeleteChecked(section.id)} title="Delete Checked Items">
                      {confirmingDeleteChecked === section.id ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}
                    </button>
                  )}      
                  {totalCount > 0 && (
                    <button className="checklist-action-btn" onClick={() => handleCompleteAllInSection(section.id)} title={areAllComplete ? "Reopen All Items" : "Complete All Items"}>
                      <i className={`fas ${areAllComplete ? 'fa-undo' : 'fa-check-square'}`}></i>
                    </button>
                  )}    
                  <button 
                    className="checklist-action-btn" 
                    onClick={() => handleSendSectionToTimer(section, false)} 
                    title="Send All to Timer">
                    <i className="fas fa-tasks"></i>
                  </button>                                            
                  <div className="checklist-action-group checklist-action-group-responses">
                    <button className="checklist-action-btn" onClick={() => handleAddResponses(section.id)} title="Add Response to All Items in Section">
                      <i className="fas fa-reply"></i>
                    </button>             
                    <button
                      className="checklist-action-btn"
                      onClick={() => handleToggleSectionResponses(section.id)}
                      title={hiddenResponsesSections.has(section.id) ? 'Show Responses in Section' : 'Hide Responses in Section'}
                    >
                      <i className={`fas fa-eye ${!hiddenResponsesSections.has(section.id) ? '' : 'disabled-icon'}`}></i>
                    </button>  
                    <button className={`checklist-action-btn ${confirmingDeleteSectionResponses === section.id ? 'confirm-delete' : ''}`} onClick={() => {
                      if (confirmingDeleteSectionResponses === section.id) {
                        handleDeleteAllSectionResponses(section.id);
                        setConfirmingDeleteSectionResponses(null);
                        if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                      } else {
                        setConfirmingDeleteSectionResponses(section.id);
                        setConfirmingDeleteSectionNotes(null);
                        if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                        confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSectionResponses(null), 3000);
                      }
                    }} title="Delete All Responses in Section">
                      {confirmingDeleteSectionResponses === section.id ? <i className="fas fa-trash-alt delete-icon"></i> : <i className="fas fa-trash-alt delete-icon"></i>}
                    </button>
                  </div>
                  <div className="checklist-action-group checklist-action-group-notes">
                    <button className="checklist-action-btn" onClick={() => handleAddNotes(section.id)} title="Add Note to All Items in Section">
                      <i className="fas fa-sticky-note"></i>
                    </button>
                    <button
                      className="checklist-action-btn"
                      onClick={() => handleToggleSectionNotes(section.id)}
                      title={hiddenNotesSections.has(section.id) ? 'Show Notes in Section' : 'Hide Notes in Section'}
                    >
                      <i className={`fas fa-eye ${!hiddenNotesSections.has(section.id) ? '' : 'disabled-icon'}`}></i>
                    </button>  
                    <button className={`checklist-action-btn ${confirmingDeleteSectionNotes === section.id ? 'confirm-delete' : ''}`} onClick={() => { if (confirmingDeleteSectionNotes === section.id) { handleDeleteAllSectionNotes(section.id); setConfirmingDeleteSectionNotes(null); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); } else { setConfirmingDeleteSectionNotes(section.id); setConfirmingDeleteSectionResponses(null); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSectionNotes(null), 3000); } }} title="Delete All Notes in Section">
                      {confirmingDeleteSectionNotes === section.id ? <i className="fas fa-trash-alt delete-icon"></i> : <i className="fas fa-trash-alt delete-icon"></i>}
                    </button>
                  </div>                  
                  <div className="checklist-action-group checklist-action-group-copy">
                    <button className="checklist-action-btn" onClick={() => {
                      const sectionToCopy = history[historyIndex].find(s => s.id === section.id);
                      if (sectionToCopy) {
                        const textToCopy = formatChecklistForCopy([sectionToCopy]);
                        navigator.clipboard.writeText(textToCopy);
                        showToast('Section copied to clipboard!');
                      }
                    }} title="Copy Section"><i className="fas fa-copy"></i>
                    </button>
                    <button className="checklist-action-btn" onClick={() => {
                      const sectionToCopy = history[historyIndex].find(s => s.id === section.id);
                      if (sectionToCopy) {
                        const header = `### ${sectionToCopy.title}`;
                        const itemsText = sectionToCopy.items.map(item => item.text).join('\n');
                        const textToCopy = `${header}\n${itemsText}`;
                        navigator.clipboard.writeText(textToCopy);
                        showToast('Section raw content copied!');
                      }
                    }} title="Copy Section Raw"><i className="fas fa-paste"></i>
                    </button>
                    <button className="checklist-action-btn" onClick={() => handleDuplicateSection(section.id)} title="Duplicate Section">
                      <i className="fas fa-clone"></i>                    
                    </button>                
                  </div>
                  <div className="checklist-action-group checklist-action-group-history">
                    <button className="checklist-action-btn" onClick={() => onUpdate(moveSection(history[historyIndex], section.id, 'up'))} title="Move Section Up"><i className="fas fa-arrow-up"></i></button>
                    <button className="checklist-action-btn" onClick={() => onUpdate(moveSection(history[historyIndex], section.id, 'down'))} title="Move Section Down"><i className="fas fa-arrow-down"></i></button>
                  </div>       
                  <button 
                    className={`checklist-delete-btn ${confirmingDeleteSectionId === section.id ? 'confirm-delete' : ''}`} 
                    onClick={() => handleDeleteSection(section.id)} 
                    title="Delete Section"
                  >
                    {confirmingDeleteSectionId === section.id ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}
                  </button>                    
                </div>
              </div>
            </header>
            {isSectionOpen && 
              <>
                <div className="checklist-progress-bar-container">
                  <div 
                    className={`checklist-progress-bar-fill ${areAllComplete ? 'complete' : ''}`} 
                    style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <div className="checklist-items">
                  {section.items.map(item => { return (
                    <div 
                      key={item.id} 
                      className={`checklist-item ${item.isCompleted ? 'completed' : ''} ${item.highlightColor ? 'highlighted' : ''} checklist-item-interactive-area`} 
                      style={{ borderLeftColor: item.highlightColor || 'transparent' }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = extractUrlFromText(item.text);
                        const isInEditMode = settings.activeTaskTabs?.[wordId] === 'edit';
                        window.electronAPI.showChecklistItemContextMenu({ 
                          wordId: wordId,
                          sectionId: section.id, 
                          itemId: item.id, 
                          isCompleted: item.isCompleted, 
                          hasNote: !!item.note, 
                          hasResponse: !!item.response, 
                          hasUrl: !!url, 
                          isInEditMode,
                          x: e.clientX, 
                          y: e.clientY 
                        });
                      }}
                    >
                      {/*
                        * This is the key change. We check if a specific item is being edited FIRST.
                        * This allows the "Edit Item" context menu action to work even when `isEditable` is false.
                      */}                  
                      {editingItemId === item.id ? (
                        <input
                          type="text"
                          value={editingItemText}
                          onChange={(e) => setEditingItemText(e.target.value)}
                          onBlur={() => {
                            handleUpdateItemText(section.id, item.id, editingItemText);
                            setEditingItemId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateItemText(section.id, item.id, editingItemText);
                              setEditingItemId(null);
                            } else if (e.key === 'Escape') {
                              setEditingItemId(null);
                            }
                          }}
                          autoFocus
                          ref={editingItemInputRef}
                          className="checklist-item-text-input"
                        />
                      ) : ( // This is the "view" mode for a single item
                        <>
                          <div className="checklist-item-main-content">
                            <label className="checklist-item-label">
                              <input
                                type="checkbox"
                                checked={item.isCompleted}
                                onChange={() => handleToggleItem(section.id, item.id)}
                              />
                              {isEditable ? (
                                <input
                                  type="text"
                                  value={item.text}
                                  onChange={(e) => handleUpdateItemText(section.id, item.id, e.target.value)}
                                  className="checklist-item-text-input"
                                />
                              ) : (
                                <ClickableText text={item.text} settings={settings} />
                              )}
                            </label>
                            {item.dueDate && !isEditable && (
                              <span
                                className={`checklist-item-due-date ${(() => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const tomorrow = new Date(today);
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  if (item.dueDate < today.getTime()) return 'overdue';
                                  if (item.dueDate < tomorrow.getTime()) return 'due-today';
                                  return '';
                                })()}`}
                              >
                                <i className="fas fa-calendar-alt"></i>
                                {formatDate(item.dueDate)}
                              </span>
                            )}
                            {!isEditable && (
                              <div className="checklist-item-quick-actions">                            
                                <button className="icon-button" onClick={() => {
                                  setEditingItemId(item.id);
                                  setEditingItemText(item.text); // Set the text for the input field
                                }} title="Edit Item"><i className="fas fa-pencil-alt"></i></button>
                                <button className="icon-button" onClick={() => handleDuplicateChecklistItem(section.id, item.id)} title="Duplicate Item"><i className="fas fa-clone"></i></button>
                                {item.response === undefined ? (
                                  <button className="icon-button" onClick={() => { handleUpdateItemResponse(section.id, item.id, ''); setEditingResponseForItemId(item.id); }} title="Add Response"><i className="fas fa-reply"></i></button>
                                ) : (
                                  <button className="icon-button" onClick={() => handleDeleteItemResponse(section.id, item.id)} title="Delete Response"><i className="fas fa-reply active-icon"></i></button>
                                )}
                                {item.note === undefined ? ( 
                                  <button className="icon-button" onClick={() => { handleUpdateItemNote(section.id, item.id, ''); setEditingNoteForItemId(item.id); }} title="Add Note"><i className="fas fa-sticky-note"></i></button>
                                ) : (
                                  <button className="icon-button" onClick={() => handleDeleteItemNote(section.id, item.id)} title="Delete Note"><i className="fas fa-sticky-note active-icon"></i></button>
                                )}
                                <button className="icon-button" onClick={() => handleSendToTimer(item, false)} title="Add to Timer"><i className="fas fa-plus-circle"></i></button>
                                <button className="icon-button" onClick={() => handleSendToTimer(item, true)} title="Add to Timer and Start"><i className="fas fa-play"></i></button>
                                <button className="icon-button" onClick={() => handleDeleteItem(section.id, item.id)} title="Delete Item"><i className="fas fa-trash-alt delete-icon"></i></button>
                              </div>
                            )}
                          </div>
                          {isEditable ? (
                            // In EDIT mode, only show the inputs if they have content or if the user just added them.
                            // The `handleUpdate...` function with an empty string creates the property, making it non-undefined.
                            <>
                              {timeLogDurations.has(item.id) ? (
                                <span className="checklist-item-logged-time">
                                  (Logged: {
                                    // Always display the derived time from the timeLog for consistency.
                                    // This ensures it matches the TimeTrackerLog's total.
                                    formatTime(timeLogDurations.get(item.id) || 0)
                                  })
                                </span>
                              ) : null}
                              {settings.showChecklistResponses && !hiddenResponsesSections.has(section.id) && (item.response !== undefined) && (
                                <div className="checklist-item-response" onContextMenu={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const url = extractUrlFromText(item.response);
                                  window.electronAPI.showChecklistResponseContextMenu({ sectionId: section.id, itemId: item.id, hasUrl: !!url, hasResponse: !!item.response, x: e.clientX, y: e.clientY });
                                }}>
                                  <strong><i className="fas fa-reply"></i> Response:</strong>
                                  <input
                                    type="text"
                                    value={item.response || ''}
                                    onChange={(e) => handleUpdateItemResponse(section.id, item.id, e.target.value)}
                                    placeholder="Add a response..."
                                    ref={el => subInputRefs.current[`response-${item.id}`] = el}
                                    className="checklist-item-sub-input"
                                  />
                                </div>
                              )}
                              {settings.showChecklistNotes && !hiddenNotesSections.has(section.id) && (item.note !== undefined) && (
                                <div className="checklist-item-note" onContextMenu={(e) => { 
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const url = extractUrlFromText(item.note);
                                  window.electronAPI.showChecklistNoteContextMenu({ sectionId: section.id, itemId: item.id, hasUrl: !!url, hasNote: !!item.note, x: e.clientX, y: e.clientY });
                                }}>
                                  <strong><i className="fas fa-sticky-note"></i> Note:</strong>
                                  <input
                                    type="text"
                                    value={item.note || ''}
                                    onChange={(e) => handleUpdateItemNote(section.id, item.id, e.target.value)}
                                    placeholder="Add a private note..."
                                    ref={el => subInputRefs.current[`note-${item.id}`] = el}
                                    className="checklist-item-sub-input"
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {timeLogDurations.has(item.id) ? (
                                <span className="checklist-item-logged-time">
                                  (Logged: {
                                    // Always display the derived time from the timeLog for consistency.
                                    // This ensures it matches the TimeTrackerLog's total.
                                    formatTime(timeLogDurations.get(item.id) || 0)
                                  })
                                </span>
                              ) : null}
                              {settings.showChecklistResponses && !hiddenResponsesSections.has(section.id) && item.response !== undefined ? (
                                <div className="checklist-item-response" onContextMenu={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const url = extractUrlFromText(item.response);
                                  window.electronAPI.showChecklistResponseContextMenu({ sectionId: section.id, itemId: item.id, hasUrl: !!url, hasResponse: !!item.response, x: e.clientX, y: e.clientY });
                                }}>
                                  <strong><i className="fas fa-reply"></i> Response:</strong>{editingResponseForItemId === item.id ? (
                                    <input
                                      type="text"
                                      value={item.response || ''}
                                      onBlur={() => setEditingResponseForItemId(null)}
                                      onChange={(e) => handleUpdateItemResponse(section.id, item.id, e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingResponseForItemId(null); }}
                                      className="checklist-item-sub-input"
                                      autoFocus
                                    />
                                  ) : (
                                    <ClickableText text={item.response} settings={settings} />
                                  )}
                                </div>
                              ) : null}
                              {settings.showChecklistNotes && !hiddenNotesSections.has(section.id) && item.note !== undefined ? (
                                <div className="checklist-item-note" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); const url = extractUrlFromText(item.note); window.electronAPI.showChecklistNoteContextMenu({ sectionId: section.id, itemId: item.id, hasUrl: !!url, hasNote: !!item.note, x: e.clientX, y: e.clientY }); }}>
                                  <strong><i className="fas fa-sticky-note"></i> Note:</strong>{editingNoteForItemId === item.id ? (
                                    <input type="text" value={item.note || ''} onBlur={() => setEditingNoteForItemId(null)} onChange={(e) => handleUpdateItemNote(section.id, item.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingNoteForItemId(null); }} className="checklist-item-sub-input" autoFocus />
                                  ) : ( <ClickableText text={item.note} settings={settings} /> )}
                                </div>
                              ) : null}
                            </>
                          )}
                          {isEditable && (
                            <div className="checklist-item-actions">
                              <input
                                type="date"
                                className="checklist-item-datepicker"
                                value={item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-CA') : ''}
                                onChange={(e) => handleUpdateItemDueDateFromPicker(section.id, item.id, e.target.value)}
                                title="Set Due Date"
                              />
                              {settings.showChecklistResponses && (item.response === undefined ? (
                                <button className="icon-button" onClick={() => { handleUpdateItemResponse(section.id, item.id, ''); setFocusSubInputKey(`response-${item.id}`); }} title="Add Response"><i className="fas fa-reply"></i></button>
                              ) : ( <button className="icon-button" onClick={() => handleDeleteItemResponse(section.id, item.id)} title="Delete Response"><i className="fas fa-reply active-icon"></i></button> )) }
                              {settings.showChecklistNotes && (item.note === undefined ? (
                                <button className="icon-button" onClick={() => { handleUpdateItemNote(section.id, item.id, ''); setFocusSubInputKey(`note-${item.id}`); }} title="Add Note"><i className="fas fa-sticky-note"></i></button>
                              ) : ( <button className="icon-button" onClick={() => handleDeleteItemNote(section.id, item.id)} title="Delete Note"><i className="fas fa-sticky-note active-icon"></i></button> )) }
                              <button className="icon-button" onClick={() => handleUpdateItemDueDate(section.id, item.id, undefined)} title="Clear Due Date"><i className="fas fa-times"></i></button>
                            </div>
                          )}                      
                        </>
                      )}
                    </div>
                  )})}
                </div>            
                <div className="checklist-add-item">
                  <textarea
                    ref={el => (addItemInputRef.current[section.id] = el)}
                    value={newItemTexts[section.id] || ''}
                    onChange={(e) => setNewItemTexts(prev => ({ ...prev, [section.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      // Submit on Enter, but allow new lines with Shift+Enter
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault(); // Prevent default newline behavior
                        handleAddItem(section.id);
                      }
                    }}
                    placeholder="Add item(s)... (Shift+Enter for new line)"
                  />
                  <button onClick={() => handleAddItem(section.id)}>+</button>
                </div>            
              </>
            }
          </div>
        );
      })}      
      <div className="checklist-actions">
        <div className="checklist-main-actions">
          <button onClick={handleAddSection} className="add-section-btn">
            <i className='fas fa-plus'></i> Add Section
          </button>
          {history[historyIndex].length > 0 && (
            <button title="Delete All Sections" onClick={handleDeleteAllSections} className={`add-section-btn delete-btn ${confirmingDeleteAllSections ? 'confirm-delete' : ''}`}>
              {confirmingDeleteAllSections ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}
            </button>
          )}
        </div>
      </div>      
      <div className="bulk-add-checklist-container">
        <textarea
          placeholder="Bulk add sections and items... (e.g., ### Section Title)"
          value={bulkAddChecklistText}
          onChange={(e) => setBulkAddChecklistText(e.target.value)}
          rows={4}
        />
        <button onClick={handleBulkAddChecklist}>
          <i className="fas fa-plus-square"></i> Bulk Add to Checklist
        </button>
        <ManageTemplatesModal
          isOpen={isManageTemplatesOpen}
          onClose={() => setIsManageTemplatesOpen(false)}
          templates={settings.checklistTemplates || []}
          onSettingsChange={onSettingsChange}
          showToast={showToast} 
        />
        {(settings.checklistTemplates && settings.checklistTemplates.length > 0) && (
          <div className="template-loader">
            <select 
              onChange={(e) => {
                handleLoadChecklistTemplate(Number(e.target.value));
                // Reset the select so the same template can be loaded again
                e.target.value = "";
              }}
              value=""
            >
              <option value="" disabled>Add from Template</option>
              {settings.checklistTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <i className="fas fa-caret-down"></i>
          </div>
        )}
        {(settings.checklistTemplates && settings.checklistTemplates.length > 0) && (
          <button onClick={() => setIsManageTemplatesOpen(true)}>Manage Templates</button>
        )}
      </div>      
    </div>
  );
}