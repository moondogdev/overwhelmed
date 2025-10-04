import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Task, ChecklistItem, ChecklistSection, InboxMessage, Settings, TimeLogEntry, ChecklistTemplate, RichTextBlock } from '../types';
import { extractUrlFromText, formatChecklistForCopy, formatDate, formatTime, indentChecklistItem, outdentChecklistItem, deleteChecklistItemAndChildren, moveChecklistItemAndChildren, formatChecklistItemsForRawCopy, moveCategory } from '../utils';

interface UseChecklistProps {
    sections: (ChecklistSection | RichTextBlock)[] | ChecklistItem[];
    onUpdate: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    isEditable: boolean;
    onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
    tasks: Task[];
    setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
    task: Task;
    taskId: number;
    onTaskUpdate: (updatedTask: Task) => void;
    checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; resetHistory: (sections: ChecklistSection[]) => void; }>;
    showToast: (message: string, duration?: number) => void;
    focusItemId: number | null;
    onFocusHandled: () => void;
    settings: Settings;
    onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
    handleGlobalToggleTimer: (taskId: number, entryId: number, entry?: TimeLogEntry, newTimeLog?: TimeLogEntry[]) => void;
    handleClearActiveTimer: () => void;
    handlePrimeTask: (taskId: number) => void;
    activeTimerEntry: TimeLogEntry | null;
    activeTimerLiveTime: number;
    handlePrimeTaskWithNewLog: (taskId: number, newTimeLog: TimeLogEntry[], timeLogTitle?: string) => void;
}

export const useChecklist = ({
    sections,
    onUpdate,
    isEditable,
    onComplete,
    tasks,
    setInboxMessages,
    task,
    taskId,
    onTaskUpdate,
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
}: UseChecklistProps) => {
    const [newItemTexts, setNewItemTexts] = useState<{ [key: number]: string }>({});
    const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
    const [editingSectionTitle, setEditingSectionTitle] = useState('');
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editingItemText, setEditingItemText] = useState('');
    const [editingResponseForItemId, setEditingResponseForItemId] = useState<number | null>(null);
    const [editingNoteForItemId, setEditingNoteForItemId] = useState<number | null>(null);
    const [focusSubInputKey, setFocusSubInputKey] = useState<string | null>(null);
    const [editingContentBlockId, setEditingContentBlockId] = useState<number | null>(null);
    const [focusEditorKey, setFocusEditorKey] = useState<string | null>(null);
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
    const [checklistSortKey, setChecklistSortKey] = useState<'default' | 'alphabetical' | 'highlight' | 'status'>('default');

    // State for local undo/redo history of checklist changes
    const [history, setHistory] = useState<(ChecklistSection | RichTextBlock)[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const isUndoingRedoing = useRef(false); // Ref to prevent feedback loops
    const historyRef = useRef(history); // Create a ref to hold the live history
    historyRef.current = history; // Keep the ref updated on every render
    const editingItemInputRef = useRef<HTMLInputElement | null>(null);

    // Create a derived map of checklist item times from the single source of truth: task.timeLog
    const timeLogDurations = useMemo(() => {
        const durations = new Map<number, number>();
        if (!task.timeLog) return durations;

        for (const entry of task.timeLog) {
            if (entry.checklistItemId) {
                const currentDuration = durations.get(entry.checklistItemId) || 0;
                const isRunning = activeTimerEntry?.id === entry.id;
                const displayDuration = isRunning ? activeTimerLiveTime : entry.duration;
                durations.set(entry.checklistItemId, currentDuration + displayDuration);
            }
        }
        return durations;
    }, [task.timeLog, activeTimerEntry, activeTimerLiveTime]);

    // Data Migration: Handle old format (ChecklistItem[]) and convert to new format (ChecklistSection[])
    const normalizedSections: (ChecklistSection | RichTextBlock)[] = React.useMemo(() => {
        if (!sections || sections.length === 0) {
            return [];
        }
        // Check if the first element is a ChecklistItem (old format)
        if ('isCompleted' in sections[0]) {
            return [{ id: 1, title: 'Checklist', items: sections as ChecklistItem[] }];
        }
        return sections as (ChecklistSection | RichTextBlock)[];
    }, [sections]);

    const sortedSections = useMemo(() => {
        const currentSections = history[historyIndex] || [];
        if (checklistSortKey === 'default') {
            return currentSections;
        }

        // Helper function to recursively sort children
        const sortChildrenOf = (parentId: number | null, itemsToSort: ChecklistItem[]): ChecklistItem[] => {
            // This function should only operate on actual checklist items, not rich text blocks.
            const items = itemsToSort.filter(item => 'isCompleted' in item); // Type guard

            const children = items.filter(i => i.parentId === parentId) as ChecklistItem[];

            if (!children.length) return [];

            children.sort((a, b) => {
                switch (checklistSortKey) {
                    case 'alphabetical':
                        return a.text.localeCompare(b.text);
                    case 'status':
                        return (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0);
                    case 'highlight':
                        if (a.highlightColor && !b.highlightColor) return -1;
                        if (!a.highlightColor && b.highlightColor) return 1;
                        return 0;
                    default:
                        return 0;
                }
            });

            let sortedList: ChecklistItem[] = [];
            for (const child of children) {
                sortedList.push(child);
                // Recursively find and append the sorted children of this child
                sortedList = sortedList.concat(sortChildrenOf(child.id, items));
            }
            return sortedList;
        };

        return currentSections.map(section => {
            // If it's a rich text block, just return it as is.
            if ('items' in section) {
                // Start the sorting process with top-level items (parentId is null)
                const sortedItems = sortChildrenOf(null, section.items);
                return { ...section, items: sortedItems };
            }
            return section; // It's a RichTextBlock, return as is.
        });

    }, [history, historyIndex, checklistSortKey]);

    const handleSortChange = (sortKey: 'default' | 'alphabetical' | 'highlight' | 'status') => {
        setChecklistSortKey(sortKey);
        showToast(`Sorted by: ${sortKey.charAt(0).toUpperCase() + sortKey.slice(1)}`);
    };

    // Initialize history when sections are loaded
    useEffect(() => {
        setHistory([normalizedSections]);
        setHistoryIndex(0);
    }, [taskId]); // Re-initialize history only when the task itself changes

    const updateHistory = (newSections: (ChecklistSection | RichTextBlock)[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newSections]);
        setHistoryIndex(newHistory.length);
    };

    const handleSendAllItemsToTimer = (startImmediately: boolean) => {
        const allSections = history[historyIndex];
        if (!allSections || allSections.length === 0) {
            showToast('Checklist is empty.');
            return;
        }

        const newTimeLogEntries: TimeLogEntry[] = [];

        // Create a set of item IDs that will be added to the timer
        const itemIdsToAdd = new Set<number>();
        allSections.forEach(block => {
            if ('items' in block) { // Type guard
                block.items.forEach(item => {
                    if (!item.isCompleted) {
                        itemIdsToAdd.add(item.id);
                    }
                });
            }
        });


        allSections.forEach(block => {
            if (!('items' in block)) return; // Skip RichTextBlocks

            // Add a header entry for the section, but only if it has items to add
            const itemsToAdd = block.items.filter(item => !item.isCompleted);
            if (itemsToAdd.length > 0) {
                newTimeLogEntries.push({
                    id: block.id + Math.random(),
                    description: block.title,
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
        const updatedSections = allSections.map(block => {
            if ('items' in block) {
                return {
                    ...block,
                    items: block.items.map(item => itemIdsToAdd.has(item.id) && item.loggedTime === undefined ? { ...item, loggedTime: 0 } : item)
                };
            }
            return block;
        });

        if (startImmediately) {
            const firstEntry = newTimeLogEntries.find(e => e.type === 'entry');
            if (firstEntry) {
                // Pass the new log AND the entry to start in a single, atomic operation.
                setTimeout(() => handleGlobalToggleTimer(task.id, firstEntry.id, firstEntry, newTimeLogEntries), 100);
                // The checklist state is updated via the global timer handler, so we only need to update history here.
                updateHistory(updatedSections);
            }
        } else {
            // Use the correct handler to prime the task without starting the timer.
            handlePrimeTaskWithNewLog(task.id, newTimeLogEntries, task.text);
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
                setTimeout(() => handleGlobalToggleTimer(task.id, firstEntry.id, firstEntry, newTimeLogEntries), 100);
                // The global timer handler will update the checklist, so we just update local history and notify the parent.
                const updatedSections = history[historyIndex].map(s => ('items' in s && s.id === section.id) ? { ...s, items: s.items.map(i => itemsToSend.find(it => it.id === i.id) && i.loggedTime === undefined ? { ...i, loggedTime: 0 } : i) } : s);
                updateHistory(updatedSections);
                onUpdate(updatedSections);
            }
        } else {
            // Use the correct handler to prime the task without starting the timer.
            const updatedSections = history[historyIndex].map(s => ('items' in s && s.id === section.id) ? { ...s, items: s.items.map(i => itemsToSend.find(it => it.id === i.id) && i.loggedTime === undefined ? { ...i, loggedTime: 0 } : i) } : s);
            handlePrimeTaskWithNewLog(task.id, newTimeLogEntries, section.title);
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
        const updatedSections = history[historyIndex].map(section => {
            if ('items' in section) {
                return {
                    ...section,
                    items: section.items.map(i =>
                        i.id === item.id && i.loggedTime === undefined ? { ...i, loggedTime: 0 } : i
                    )
                };
            }
            return section;
        });

        if (startImmediately) {
            // For starting immediately, we create the new log by appending the entry
            // and pass it all to the atomic handler.
            const newTimeLog = [...(task.timeLog || []), newEntry];
            setTimeout(() => handleGlobalToggleTimer(taskId, newEntry.id, newEntry, newTimeLog), 100);
        } else {
            // For just adding without starting, a simple update is sufficient and correct.
            onTaskUpdate({ ...task, timeLog: [...(task.timeLog || []), newEntry] });
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
        const newSections = history[historyIndex].map(sec => 
            'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, text: newText } : item) } : sec
        );
        if (!isUndoingRedoing.current) {
            updateHistory(newSections);
        }
        onUpdate(newSections);
    };

    const handleUpdateItemResponse = (sectionId: number, itemId: number, newResponse: string) => {
        const newSections = history[historyIndex].map(sec => 
            'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, response: newResponse } : item) } : sec
        );
        updateHistory(newSections);
        onUpdate(newSections);
    };

    const handleUpdateItemNote = (sectionId: number, itemId: number, newNote: string) => {
        const newSections = history[historyIndex].map(sec => 
            'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, note: newNote } : item) } : sec
        );
        updateHistory(newSections);
        onUpdate(newSections);
    };

    const handleDeleteItemResponse = (sectionId: number, itemId: number) => {
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, response: undefined } : item) } : sec
        );
        updateHistory(newSections);
        onUpdate(newSections);
    };

    const handleDeleteItemNote = (sectionId: number, itemId: number) => {
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, response: undefined } : item) } : sec
        );
        updateHistory(newSections);
        onUpdate(newSections);
    };

    const handleUpdateItemDueDate = (sectionId: number, itemId: number, newDueDate: number | undefined) => {
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId
                ? { ...sec, items: sec.items.map(item => (item.id === itemId ? { ...item, dueDate: newDueDate } : item)) }
                : sec,
        );
        updateHistory(newSections);
        onUpdate(newSections);
    };

    const handleUpdateItemDueDateFromPicker = (sectionId: number, itemId: number, dateString: string) => {
        const newDueDate = dateString ? new Date(dateString + 'T00:00:00').getTime() : undefined;
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => (item.id === itemId ? { ...item, dueDate: newDueDate } : item)) } : sec
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

    const handleAddRichTextBlock = (sectionId: number, contentBlockId?: number | null) => {        
        // If a content block already exists, switch to edit mode and focus it.
        if (contentBlockId) {            
            setEditingContentBlockId(contentBlockId);
            return;        }

        // Otherwise, add a new content block before the section.
        const currentChecklist = history[historyIndex];
        const sectionIndex = currentChecklist.findIndex(s => s.id === sectionId);
    
        if (sectionIndex === -1) return;
    
        const newBlock: RichTextBlock = {
            id: Date.now() + Math.random(),
            type: 'rich-text',
            content: '<h3>Section Title</h3><p>Section description...</p>',
        };
    
        const newChecklist = [...currentChecklist];
        newChecklist.splice(sectionIndex, 0, newBlock);
    
        updateHistory(newChecklist); onUpdate(newChecklist); showToast('Content block added!');
    };

    const handleUpdateRichTextBlockContent = (blockId: number, newContent: string) => {
        const newChecklist = history[historyIndex].map(block => 
            'type' in block && block.type === 'rich-text' && block.id === blockId
                ? { ...block, content: newContent } 
                : block
        );
        updateHistory(newChecklist);
        onUpdate(newChecklist);
    };

    const handleDeleteRichTextBlock = (blockId: number) => {
        const newChecklist = history[historyIndex].filter(block => block.id !== blockId);
        updateHistory(newChecklist);
        setEditingContentBlockId(null); // Ensure we exit editing mode
        onUpdate(newChecklist);
        showToast('Content block deleted.');
    };

    const handleUpdateSectionTitle = (sectionId: number, newTitle: string) => {
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, title: newTitle } : sec
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
        if (!('items' in sectionToDuplicate)) return; // Can't duplicate a rich text block this way

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

        const blocksToAdd: (ChecklistSection | RichTextBlock)[] = [];
        const sections = bulkAddChecklistText.split('\n---\n');

        for (const sectionText of sections) {
            const trimmedSection = sectionText.trim();
            if (!trimmedSection) continue;

            // Case 1: It's a Rich Text Block
            if (trimmedSection.startsWith('<div>') && trimmedSection.endsWith('</div>')) {
                const newBlock: RichTextBlock = {
                    id: Date.now() + Math.random(),
                    type: 'rich-text',
                    content: trimmedSection.slice(5, -6), // Remove <div> and </div>
                };
                blocksToAdd.push(newBlock);
                continue;
            }

            // Case 2: It's a Checklist Section
            const lines = trimmedSection.split('\n');
            const firstLine = lines[0].trim();
            if (firstLine.startsWith('###')) {
                const newSection: ChecklistSection = {
                    id: Date.now() + Math.random(),
                    title: firstLine.substring(3).trim(),
                    items: [],
                };

                const parentStack: (number | null)[] = [null];

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line.trim()) continue;

                    const indentMatch = line.match(/^(\s*|-+|\*+)\s*/);
                    const indent = indentMatch ? indentMatch[1] : '';
                    const level = indent.includes('-') || indent.includes('*') ? 1 : Math.floor(indent.length / 2);

                    const newItem: ChecklistItem = {
                        id: Date.now() + Math.random(),
                        text: line.trim().replace(/^(-|\*)\s*/, ''),
                        isCompleted: false,
                        level: level,
                        parentId: level > 0 ? parentStack[level - 1] : null,
                    };
                    newSection.items.push(newItem);
                    parentStack[level] = newItem.id;
                    parentStack.splice(level + 1);
                }
                blocksToAdd.push(newSection);
            }
        }

        const newSections = [...history[historyIndex], ...blocksToAdd];
        updateHistory(newSections);
        onUpdate(newSections);
        setBulkAddChecklistText(''); // Clear the input
        showToast(`${blocksToAdd.length} block(s) added!`);
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
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return;

        const newItems: ChecklistItem[] = [];
        const parentStack: (number | null)[] = [null]; // Stack to keep track of parent IDs at each level

        // Find the last item in the current list to correctly determine the initial parent
        const currentSection = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined);
        const lastItem = currentSection?.items[currentSection.items.length - 1];
        if (lastItem) {
            parentStack[lastItem.level || 0] = lastItem.id;
        }

        lines.forEach(line => {
            const indentMatch = line.match(/^(\s*|-+|\*+)\s*/);
            const indent = indentMatch ? indentMatch[1] : '';
            const level = indent.includes('-') || indent.includes('*') ? 1 : Math.floor(indent.length / 2);

            const newItem: ChecklistItem = {
                id: Date.now() + Math.random(),
                text: line.trim().replace(/^(-|\*)\s*/, ''),
                isCompleted: false,
                level: level,
                parentId: level > 0 ? parentStack[level - 1] : null,
            };

            newItems.push(newItem);
            parentStack[level] = newItem.id;
            // Clear deeper levels from the stack
            parentStack.splice(level + 1);
        });

        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, items: [...sec.items, ...newItems] } : sec
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
            if (!('items' in sec) || sec.id !== sectionId) return sec;

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
            const checklistSectionsOnly = newSections.filter(s => 'items' in s) as ChecklistSection[];
            onComplete(toggledItem, sectionId, checklistSectionsOnly);
        }

        if (!isUndoingRedoing.current) {
            updateHistory(newSections);
        }
        onUpdate(newSections);
    };

    const moveSection = (sections: (ChecklistSection | RichTextBlock)[], sectionId: number, direction: 'up' | 'down'): (ChecklistSection | RichTextBlock)[] => {
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

    const handleMoveBlock = (blockId: number, direction: 'up' | 'down') => {
        const currentSections = history[historyIndex];
        const newSections = [...currentSections];
        const index = newSections.findIndex(s => s.id === blockId);

        if (index === -1) return;

        // A block is "paired" if it's a rich text block followed by a checklist section.
        const isPaired = 'type' in newSections[index] && (index + 1 < newSections.length) && !('type' in newSections[index + 1]);
        const itemsToMoveCount = isPaired ? 2 : 1;

        if (direction === 'up' && index > 0) {
            // To move up, we swap with the block(s) above.
            // Check if the block above is the start of another pair.
            const prevIsPaired = (index - 2 >= 0) && 'type' in newSections[index - 2] && !('type' in newSections[index - 1]);
            const prevItemsCount = prevIsPaired ? 2 : 1;
            
            const itemsToMove = newSections.splice(index, itemsToMoveCount);
            newSections.splice(index - prevItemsCount, 0, ...itemsToMove);

        } else if (direction === 'down' && (index + itemsToMoveCount) < newSections.length) {
            // To move down, we swap with the block(s) below.
            const itemsToMove = newSections.splice(index, itemsToMoveCount);
            newSections.splice(index + 1, 0, ...itemsToMove);
        }
        updateHistory(newSections);
        onUpdate(newSections);
    };

    const handleAssociateBlock = (sectionId: number, blockId: number) => {        
        const currentSections = history[historyIndex];
        let newSections = [...currentSections];

        const sectionToMove = newSections.find(s => s.id === sectionId);
        if (!sectionToMove) return;

        // First, remove the section from its current position.
        newSections = newSections.filter(s => s.id !== sectionId);

        const targetBlockIndex = newSections.findIndex(b => b.id === blockId);
        if (targetBlockIndex === -1) return;

        // Find the end of the group associated with the target block.
        let insertionIndex = targetBlockIndex + 1;
        while (insertionIndex < newSections.length && !('type' in newSections[insertionIndex])) {
            insertionIndex++; // Keep moving forward as long as the next item is a ChecklistSection.
        }
        newSections.splice(insertionIndex, 0, sectionToMove);
        updateHistory(newSections); onUpdate(newSections); showToast('Section associated with content block!');
    };

    const handleCopyBlock = (blockId: number) => {
        const currentSections = history[historyIndex];
        const index = currentSections.findIndex(b => b.id === blockId);
        if (index === -1 || !('type' in currentSections[index])) return;

        const richTextBlock = currentSections[index] as RichTextBlock;
        
        const associatedSections: ChecklistSection[] = [];
        let j = index + 1;
        while (j < currentSections.length && !('type' in currentSections[j])) {
            associatedSections.push(currentSections[j] as ChecklistSection);
            j++;
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = richTextBlock.content;

        // Manually build the text content, adding newlines for block-level elements.
        let richTextContent = '';
        tempDiv.childNodes.forEach(node => {
            if (node.textContent) {
                richTextContent += node.textContent + '\n';
            }
        });
        const checklistContent = formatChecklistForCopy(associatedSections);

        const fullContent = `${richTextContent}\n\n---\n\n${checklistContent}`.trim();
        navigator.clipboard.writeText(fullContent);
        showToast('Block content copied!');
    };

    const handleCopyBlockRaw = (blockId: number) => {
        const currentSections = history[historyIndex];
        const index = currentSections.findIndex(b => b.id === blockId);
        if (index === -1 || !('type' in currentSections[index])) return;

        const blocksToCopy: (RichTextBlock | ChecklistSection)[] = [currentSections[index]];
        let j = index + 1;
        while (j < currentSections.length && !('type' in currentSections[j])) {
            blocksToCopy.push(currentSections[j]);
            j++;
        }

        const allRawText = blocksToCopy.map(block => {
            // Use explicit type guards to help TypeScript
            if ('items' in block) {
                const section = block as ChecklistSection;
                return `### ${section.title}\n${formatChecklistItemsForRawCopy(section.items)}`;
            }
            const richTextBlock = block as RichTextBlock;
            return `<div>${richTextBlock.content}</div>`;
        }).join('\n---\n');
        navigator.clipboard.writeText(allRawText);
        showToast('Block raw content copied!');
    };

    const handleDetachFromBlock = (sectionId: number) => {
        const currentSections = history[historyIndex];
        const sectionIndex = currentSections.findIndex(s => s.id === sectionId);

        if (sectionIndex === -1 || sectionIndex === 0) return;

        // Create a new, empty rich text block to act as a separator
        const newSeparatorBlock: RichTextBlock = {
            id: Date.now() + Math.random(),
            type: 'rich-text',
            content: '', // Intentionally empty
        };

        const newSections = [...currentSections];
        newSections.splice(sectionIndex, 0, newSeparatorBlock);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Section detached into a new block.');
    };
    const handleCompleteAllInSection = (sectionId: number) => {
        const sectionToUpdate = history[historyIndex].find(sec => 'items' in sec && sec.id === sectionId) as (ChecklistSection | undefined);
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
            const parentTask = tasks.find((w: Task) => w.checklist?.some((s: any) => 'items' in s && s.id === sectionId));
            if (parentTask) {
                setInboxMessages((prev: InboxMessage[]) => [{ id: Date.now() + Math.random(), type: 'completed', text: `Section completed: "${sectionToUpdate.title}" in task "${parentTask.text}"`, timestamp: Date.now(), taskId: parentTask.id, sectionId: sectionId }, ...prev]);
            }
        }

        // Finally, update the state to toggle all items.
        const newSections = history[historyIndex].map(sec => 'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(i => ({ ...i, isCompleted: !areAllCurrentlyCompleted })) } : sec);
        if (!isUndoingRedoing.current) {
            updateHistory(newSections);
        }
        onUpdate(newSections);
    };

    const handleToggleAllSections = () => {
        const allItems = history[historyIndex].flatMap(sec => 'items' in sec ? sec.items : []);
        if (allItems.length === 0) return;

        const areAllItemsComplete = allItems.every(item => item.isCompleted);

        const newSections = history[historyIndex].map(sec => {
            if ('items' in sec) {
                return {
                    ...sec,
                    items: sec.items.map(item => {
                        if (!areAllItemsComplete && !item.isCompleted) onComplete(item, sec.id, []);
                        return { ...item, isCompleted: !areAllItemsComplete };
                    })
                };
            }
            return sec;
        });
        if (!isUndoingRedoing.current) {
            updateHistory(newSections);
        }
        onUpdate(newSections);
    };

    const handleDeleteChecked = (sectionId?: number) => {
        const confirmKey = sectionId === undefined ? 'all' : sectionId;
        if (confirmingDeleteChecked === confirmKey) {
            const newSections = history[historyIndex].map(sec => {
                if ('items' in sec && (sectionId === undefined || sec.id === sectionId)) {
                    return { ...sec, items: sec.items.filter(item => !item.isCompleted) };
                }
                return sec;
            });

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
        // Use the new cascade-delete function
        const newSections = deleteChecklistItemAndChildren(history[historyIndex], sectionId, itemId);
        if (!isUndoingRedoing.current) {
            updateHistory(newSections);
        }
        onUpdate(newSections);
    };

    const handlePromoteItemToHeader = (sectionId: number, itemId: number) => {
        const currentSections = history[historyIndex];
        const sectionIndex = currentSections.findIndex(s => 'items' in s && s.id === sectionId) as number;
        if (sectionIndex === -1) return;

        const sourceSectionBlock = currentSections[sectionIndex];
        if (!('items' in sourceSectionBlock)) return; // Should not happen due to findIndex, but for type safety.
        const sourceSection = sourceSectionBlock;
        const itemIndex = sourceSection.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const itemToPromote = sourceSection.items[itemIndex];

        // Helper to recursively find all descendants
        const findDescendants = (items: ChecklistItem[], parentId: number): ChecklistItem[] => {
            const children = items.filter(i => i.parentId === parentId);
            let descendants = [...children];
            children.forEach(child => {
                descendants = [...descendants, ...findDescendants(items, child.id)];
            });
            return descendants;
        };

        const descendants = findDescendants(sourceSection.items, itemId);
        const descendantIds = new Set(descendants.map(d => d.id));

        const newSection: ChecklistSection = {
            id: Date.now() + Math.random(),
            title: itemToPromote.text,
            items: descendants.map(descendant => ({ ...descendant, level: (descendant.level || 0) - ((itemToPromote.level || 0) + 1), parentId: descendant.parentId === itemToPromote.id ? null : descendant.parentId })),
        };
        const newSections = [...currentSections];
        // We know this is a ChecklistSection because of the guards above.
        (newSections[sectionIndex] as ChecklistSection).items = sourceSection.items.filter(i => i.id !== itemId && !descendantIds.has(i.id));
        newSections.splice(sectionIndex + 1, 0, newSection);
        updateHistory(newSections); onUpdate(newSections); showToast('Item promoted to new section!');
    };
    
    const handleIndent = (sectionId: number, itemId: number) => {
        const newSections = indentChecklistItem(history[historyIndex], sectionId, itemId);
        updateHistory(newSections);
        onUpdate(newSections);
    };

    const handleOutdent = (sectionId: number, itemId: number) => {
        const newSections = outdentChecklistItem(history[historyIndex], sectionId, itemId);
        updateHistory(newSections);
        onUpdate(newSections);
    };

    const handleIndentChecked = (direction: 'indent' | 'outdent') => {
        let tempSections = JSON.parse(JSON.stringify(history[historyIndex]));
        let itemsProcessed = 0;

        for (const block of tempSections) {
            if (!('items' in block)) continue;
            const section = block as ChecklistSection;

            const itemsToIndent = section.items.filter((i: ChecklistItem) => i.isCompleted);
            if (itemsToIndent.length === 0) continue;

            itemsProcessed += itemsToIndent.length;

            // Process checked items in reverse to avoid index issues
            for (let i = section.items.length - 1; i >= 0; i--) {
                const currentItem = section.items[i];
                if (!currentItem.isCompleted) continue;

                if (direction === 'indent') {
                    // Find the first non-checked item above the current one to be the parent.
                    let potentialParent = null;
                    for (let j = i - 1; j >= 0; j--) {
                        if (!section.items[j].isCompleted) {
                            potentialParent = section.items[j];
                            break;
                        }
                    }

                    if (potentialParent) {
                        const parentLevel = potentialParent.level || 0;
                        currentItem.parentId = potentialParent.id;
                        currentItem.level = parentLevel + 1;
                    }
                } else { // outdent
                    const currentLevel = currentItem.level || 0;
                    if (currentLevel > 0) {
                        const parent = section.items.find((p: ChecklistItem) => p.id === currentItem.parentId);
                        currentItem.parentId = parent ? parent.parentId : null;
                        currentItem.level = parent ? (parent.level || 0) : 0;
                    }
                }
            }
        }

        if (itemsProcessed > 0) {
            updateHistory(tempSections);
            onUpdate(tempSections);
            showToast(`${itemsProcessed} item(s) ${direction}ed.`);
        } else {
            showToast('No items are checked.');
        }
    };

    const handleTabOnChecklistItem = (sectionId: number, itemId: number, shiftKey: boolean) => {
        const direction = shiftKey ? 'outdent' : 'indent';
        const anyItemsChecked = history[historyIndex].some(sec => 'items' in sec && sec.items.some(item => item.isCompleted));

        if (anyItemsChecked) {
            // If any items are checked, perform the bulk action.
            handleIndentChecked(direction);
        } else {
            // Otherwise, perform the action on the single focused item.
            if (direction === 'indent') {
                handleIndent(sectionId, itemId);
            } else {
                handleOutdent(sectionId, itemId);
            }
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            isUndoingRedoing.current = true;
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            // Find the parent task and update it with the historical checklist state
            onUpdate(history[newIndex]);
            setTimeout(() => isUndoingRedoing.current = false, 0);
        }
    };

    
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            isUndoingRedoing.current = true;
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
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
        onSettingsChange(prevSettings => ({ ...prevSettings, openChecklistSectionIds: newOpenIds }));
    }, [settings.openChecklistSectionIds, onSettingsChange]);

    const handleCollapseAllSections = React.useCallback(() => {
        onSettingsChange(prev => ({ ...prev, openChecklistSectionIds: [] }));
    }, [onSettingsChange]);

    const handleExpandAllSections = React.useCallback(() => {
        const allSectionIds = historyRef.current[historyIndex].filter(s => 'items' in s).map(s => s.id);
        onSettingsChange(prev => ({ ...prev, openChecklistSectionIds: allSectionIds }));
    }, [historyIndex, onSettingsChange]);

    const handleAddNotes = React.useCallback((sectionId?: number) => {
        const newSections = history[historyIndex].map(sec => {
            if ('items' in sec && (!sectionId || sec.id === sectionId)) {
                return {
                    ...sec,
                    items: sec.items.map(item =>
                        item.note === undefined ? { ...item, note: '' } : item
                    )
                };
            }
            return sec;
        });
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Note fields added!');
    }, [history, historyIndex, onUpdate, showToast]);

    const handleAddResponses = React.useCallback((sectionId?: number) => {
        const newSections = history[historyIndex].map(sec => {
            if ('items' in sec && (!sectionId || sec.id === sectionId)) {
                return {
                    ...sec,
                    items: sec.items.map(item =>
                        item.response === undefined ? { ...item, response: '' } : item
                    )
                };
            }
            return sec;
        });
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Response fields added!');
    }, [history, historyIndex, onUpdate, showToast]);

    const handleDeleteAllResponses = () => {
        const newSections = history[historyIndex].map(sec => {
            if ('items' in sec) {
                return {
                    ...sec,
                    items: sec.items.map(item => { const { response, ...rest } = item; return rest; })
                };
            }
            return sec;
        });
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('All Response deleted!');
    };


    const handleDeleteAllNotes = () => {
        const newSections = history[historyIndex].map(sec => {
            if ('items' in sec) {
                return {
                    ...sec,
                    items: sec.items.map(item => { const { note, ...rest } = item; return rest; })
                };
            }
            return sec;
        });
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('All Notes deleted!');
    };

    const handleDeleteAllSectionResponses = (sectionId: number) => {
        const newSections = history[historyIndex].map(sec => {
            if ('items' in sec && sec.id === sectionId) {
                return {
                    ...sec,
                    items: sec.items.map(item => { const { response, ...rest } = item; return rest; })
                };
            }
            return sec;
        });
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Section Responses deleted!');
    };

    const handleDeleteAllSectionNotes = (sectionId: number) => {
        const newSections = history[historyIndex].map(sec => 'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => { const { note, ...rest } = item; return rest; }) } : sec);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Section Notes deleted!');
    };

    const handleDuplicateChecklistItem = (sectionId: number, itemId: number) => {
        const currentSections = history[historyIndex];
        const section = currentSections.find(s => 'items' in s && s.id === sectionId) as ChecklistSection | undefined;
        if (!section) return;
        const itemIndex = section.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;
        const itemToDuplicate = section.items[itemIndex];
        const duplicatedItem = { ...itemToDuplicate, id: Date.now() + Math.random(), text: `${itemToDuplicate.text} (Copy)` };
        const newItems = [...section.items];
        newItems.splice(itemIndex + 1, 0, duplicatedItem);
        const newSections = currentSections.map(s => 'items' in s && s.id === sectionId ? { ...s, items: newItems } : s);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Item duplicated!');
        // Set the newly created item to be in edit mode immediately.
        setEditingItemId(duplicatedItem.id);
        setEditingItemText(duplicatedItem.text);
    };

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
            case 'copy_all_sections': {
                const sectionsToCopy = history[historyIndex].filter(s => 'items' in s) as ChecklistSection[];
                const textToCopy = formatChecklistForCopy(sectionsToCopy);
                navigator.clipboard.writeText(textToCopy);
                showToast('All sections copied to clipboard!');
                break;
            }
            case 'copy_all_sections_raw': {
                const allRawText = history[historyIndex].map(block => {
                    if ('items' in block) {
                        const header = `### ${block.title}`;
                        const itemsText = formatChecklistItemsForRawCopy(block.items);
                        return `${header}\n${itemsText}`;
                    }
                    return `<div>${block.content}</div>`; // Represent rich text block somehow
                }).join('\n---\n');
                navigator.clipboard.writeText(allRawText);
                showToast('All sections raw content copied!');
                break;
            }
            case 'save_checklist_as_template': {
                const sectionsOnly = history[historyIndex].filter(s => 'items' in s) as ChecklistSection[];
                setTemplateSectionsToSave(sectionsOnly);
                setIsSaveTemplatePromptOpen(true);
                break;
            }
            case 'clear_all_highlights': {
                const newSections = history[historyIndex].map(sec => 
                    'items' in sec ? { ...sec, items: sec.items.map(item => ({ ...item, highlightColor: undefined } as ChecklistItem)) } : sec
                );
                updateHistory(newSections);
                onUpdate(newSections);
                showToast('All highlights cleared.');
                break;
            }
            default: break; // Do nothing for unhandled commands
        }
    }, [history, historyIndex, handleExpandAllSections, handleCollapseAllSections, handleAddNotes, handleAddResponses, handleDeleteAllNotes, handleDeleteAllResponses, handleDeleteAllSections, handleSendAllItemsToTimer, showToast, setTemplateSectionsToSave, setIsSaveTemplatePromptOpen, onUpdate]);

    // IPC Command Handling - Moved from useChecklistIPC.ts to have direct access to fresh state
    useEffect(() => {
        const handleChecklistCommand = (payload: { command: string, sectionId: number, itemId: number, color?: string }) => {
            const { command, sectionId, itemId, color } = payload;
            const currentSections = history[historyIndex];
            const section = currentSections.find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined);
            if (!section) return;

            const itemIndex = section.items.findIndex(item => item.id === itemId);
            if (itemIndex === -1 && command !== 'edit' && command !== 'edit_response' && command !== 'edit_note') return;

            let newItems = [...section.items];
            let newSections = [...currentSections];

            switch (command) {
                case 'toggle_complete': handleToggleItem(sectionId, itemId); return;
                case 'delete': handleDeleteItem(sectionId, itemId); return;
                case 'copy': navigator.clipboard.writeText(section.items.find(i => i.id === itemId)?.text || ''); showToast('Checklist item copied!'); return;
                case 'duplicate': handleDuplicateChecklistItem(sectionId, itemId); return;
                case 'add_before': newItems.splice(itemIndex, 0, { id: Date.now() + Math.random(), text: 'New Item', isCompleted: false }); break;
                case 'add_after': newItems.splice(itemIndex + 1, 0, { id: Date.now() + Math.random(), text: 'New Item', isCompleted: false }); break;
                case 'indent': newSections = indentChecklistItem(currentSections, sectionId, itemId); break;
                case 'outdent': newSections = outdentChecklistItem(currentSections, sectionId, itemId); break;
                case 'move_up': newSections = moveChecklistItemAndChildren(currentSections, sectionId, itemId, 'up'); break;
                case 'move_down': newSections = moveChecklistItemAndChildren(currentSections, sectionId, itemId, 'down'); break;
                case 'highlight': newSections = newSections.map(s => 'items' in s && s.id === sectionId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, highlightColor: color } : i) } : s); break;
                case 'delete_note': handleDeleteItemNote(sectionId, itemId); return;
                case 'delete_response': handleDeleteItemResponse(sectionId, itemId); return;
                case 'promote_to_header': handlePromoteItemToHeader(sectionId, itemId); return;
            }

            if (command === 'open_link') { /* ... existing logic ... */ return; }
            // ... other non-state-updating commands

            if (!['highlight', 'move_up', 'move_down', 'indent', 'outdent'].includes(command)) {
                newSections = newSections.map(s => 'items' in s && s.id === sectionId ? { ...s, items: newItems } : s);
            }

            updateHistory(newSections);
            onUpdate(newSections);

            if (payload.command === 'edit') {
                const item = section?.items.find(i => i.id === payload.itemId);
                if (item) { setEditingItemId(item.id); setEditingItemText(item.text); }
            } else if (payload.command === 'edit_response') {
                const item = section?.items.find(i => i.id === payload.itemId);
                if (item) { if (item.response === undefined) handleUpdateItemResponse(payload.sectionId, payload.itemId, ''); setEditingResponseForItemId(payload.itemId); }
            } else if (payload.command === 'edit_note') {
                const item = section?.items.find(i => i.id === payload.itemId);
                if (item) { if (item.note === undefined) handleUpdateItemNote(payload.sectionId, payload.itemId, ''); setEditingNoteForItemId(payload.itemId); }
            } else if (command === 'send_to_timer') {
                const item = section.items.find(i => i.id === itemId);
                if (item) handleSendToTimer(item, false);
            } else if (command === 'send_to_timer_and_start') {
                const item = section.items.find(i => i.id === itemId);
                if (item) handleSendToTimer(item, true);
            } else if (command === 'view' && taskId) {
                onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [taskId]: 'ticket' } });
                if (!settings.openAccordionIds.includes(taskId)) onSettingsChange({ openAccordionIds: [...new Set([...settings.openAccordionIds, taskId])] });
            }
        };

        const handleSectionCommand = (payload: { command: string, sectionId?: number, blockId?: number }) => {
            const { command, sectionId } = payload;
            if (!sectionId) {
                handleGlobalChecklistCommand(payload);
                return;
            }            
            switch (command) {
                case 'move_section_up': onUpdate(moveSection(history[historyIndex], sectionId, 'up')); break;
                case 'move_section_down': onUpdate(moveSection(history[historyIndex], sectionId, 'down')); break;
                case 'undo_checklist': handleUndo(); break;
                case 'redo_checklist': handleRedo(); break;
                case 'edit_title': { const section = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined); if (section) { setEditingSectionId(section.id); setEditingSectionTitle(section.title); } break; }                
                case 'toggle_all_in_section': handleCompleteAllInSection(sectionId); break;
                case 'toggle_collapse': handleToggleSectionCollapse(sectionId); break;
                case 'add_note_to_section': handleAddNotes(sectionId); break;
                case 'add_response_to_section': handleAddResponses(sectionId); break;
                case 'toggle_section_notes': handleToggleSectionNotes(sectionId); break;
                case 'toggle_section_responses': handleToggleSectionResponses(sectionId); break;
                case 'copy_section': { const sectionToCopy = history[historyIndex].find(s => s.id === sectionId); if (sectionToCopy && 'items' in sectionToCopy) { const textToCopy = formatChecklistForCopy([sectionToCopy as ChecklistSection]); navigator.clipboard.writeText(textToCopy); showToast('Section copied to clipboard!'); } break; }
                case 'copy_section_raw': { const sectionToCopy = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined); if (sectionToCopy) { const header = `### ${sectionToCopy.title}`; const itemsText = formatChecklistItemsForRawCopy(sectionToCopy.items); const textToCopy = `${header}\n${itemsText}`; navigator.clipboard.writeText(textToCopy); showToast('Section raw content copied!'); } break; }
                case 'clear_all_highlights': { const newSections = history[historyIndex].map(sec => 'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => ({ ...item, highlightColor: undefined } as ChecklistItem)) } : sec); updateHistory(newSections); onUpdate(newSections); showToast('Highlights cleared for section.'); break; }
                case 'duplicate_section': handleDuplicateSection(sectionId); break;
                case 'delete_section': handleDeleteSection(sectionId); break;
                case 'send_section_to_timer': { const section = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined); if (section) handleSendSectionToTimer(section, false); break; }
                case 'send_section_to_timer_and_start': { const section = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined); if (section) handleSendSectionToTimer(section, true); break; }                
                case 'associate_with_block': handleAssociateBlock(payload.sectionId, payload.blockId); break;
                case 'detach_from_block': handleDetachFromBlock(sectionId); break;
                case 'save_section_as_template': { const sectionToSave = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined); if (sectionToSave) { setTemplateSectionsToSave([sectionToSave]); setIsSaveTemplatePromptOpen(true); } break; }                
            }
        };

        const handleMainHeaderCommand = (payload: { command: string, taskId?: number }) => {
            if (payload.command === 'view' && payload.taskId) { onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [payload.taskId]: 'ticket' } }); if (!settings.openAccordionIds.includes(payload.taskId)) { onSettingsChange({ openAccordionIds: [...new Set([...settings.openAccordionIds, payload.taskId])] }); } }
            else if (payload.command === 'edit' && payload.taskId) { const targetTask = tasks.find(w => w.id === payload.taskId); if (targetTask && !targetTask.completedDuration) { onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [payload.taskId]: 'edit' }, openAccordionIds: [...new Set([...settings.openAccordionIds, payload.taskId])] }); } }
            else { handleGlobalChecklistCommand(payload); }
        };

        const cleanupItem = window.electronAPI.on('checklist-item-command', handleChecklistCommand);
        // This now correctly handles both section-specific and global commands from this menu.
        const cleanupSection = window.electronAPI.on('checklist-section-command', (payload) => 
            payload.sectionId ? handleSectionCommand(payload) : handleGlobalChecklistCommand(payload));
        const cleanupMainHeader = window.electronAPI.on('checklist-main-header-command', handleMainHeaderCommand);

        return () => { cleanupItem?.(); cleanupSection?.(); cleanupMainHeader?.(); };
    }, [history, historyIndex, onUpdate, onComplete, tasks, settings, onSettingsChange, showToast, handleGlobalChecklistCommand, handleSendToTimer, handleSendSectionToTimer, handleCompleteAllInSection, handleUpdateItemResponse, handleUpdateItemNote, handleDuplicateChecklistItem, setEditingItemId, setEditingItemText, setEditingResponseForItemId, setEditingNoteForItemId, setEditingSectionId, setEditingSectionTitle, moveSection, isEditable, handleToggleItem, handleDeleteItem, handleUndo, handleRedo, handleToggleSectionCollapse, handleAddNotes, handleAddResponses, handleToggleSectionNotes, handleToggleSectionResponses, handleDuplicateSection, handleDeleteSection, setTemplateSectionsToSave, setIsSaveTemplatePromptOpen]);

    return {
        newItemTexts, setNewItemTexts,
        editingSectionId, setEditingSectionId,
        editingSectionTitle, setEditingSectionTitle,
        editingItemId, setEditingItemId,
        editingItemText, setEditingItemText,
        editingResponseForItemId, setEditingResponseForItemId,
        editingNoteForItemId, setEditingNoteForItemId,
        editingContentBlockId, 
        setEditingContentBlockId,
        focusEditorKey,
        setFocusEditorKey,
        focusSubInputKey, setFocusSubInputKey,
        subInputRefs,
        hiddenNotesSections, setHiddenNotesSections,
        hiddenResponsesSections, setHiddenResponsesSections,
        confirmingDeleteSectionNotes, setConfirmingDeleteSectionNotes,
        confirmingDeleteSectionResponses, setConfirmingDeleteSectionResponses,
        confirmingDeleteNotes, setConfirmingDeleteNotes,
        confirmingDeleteAllSections, setConfirmingDeleteAllSections,
        confirmingDeleteResponses, setConfirmingDeleteResponses,
        confirmingDeleteSectionId, setConfirmingDeleteSectionId,
        confirmingDeleteChecked, setConfirmingDeleteChecked,
        confirmTimeoutRef,
        addItemInputRef,
        bulkAddChecklistText, setBulkAddChecklistText,
        isSaveTemplatePromptOpen, setIsSaveTemplatePromptOpen,
        templateSectionsToSave, setTemplateSectionsToSave,
        isManageTemplatesOpen, setIsManageTemplatesOpen,
        history, historyIndex,
        editingItemInputRef,
        timeLogDurations,
        handleSendAllItemsToTimer,
        handleSendSectionToTimer,
        handleSendToTimer,
        handleToggleSectionNotes,
        handleToggleSectionResponses,
        handleUpdateItemText,
        handleUpdateItemResponse,
        handleUpdateItemNote,
        handleDeleteItemResponse,
        handleDeleteItemNote,
        handleUpdateItemDueDate,
        handleUpdateItemDueDateFromPicker,
        handleAddSection,
        handleAddRichTextBlock,
        handleCopyBlock,
        handleCopyBlockRaw,
        handleMoveBlock,
        handleUpdateRichTextBlockContent,
        handleDeleteRichTextBlock,
        handleUpdateSectionTitle,
        handleDuplicateSection,
        handleDeleteSection,
        handleDeleteAllSections,
        handleBulkAddChecklist,
        handleLoadChecklistTemplate,
        handleSaveChecklistTemplate,
        handleAddItem,
        handleToggleItem,
        moveSection,
        handleCompleteAllInSection,
        handleToggleAllSections,
        handleDeleteChecked,
        handleDeleteItem,
        handleUndo,
        handleRedo,
        handleIndent,
        handleOutdent,
        sortedSections,
        handleSortChange,
        handleTabOnChecklistItem,
        handleIndentChecked,
        handlePromoteItemToHeader,
        handleToggleSectionCollapse,
        handleCollapseAllSections,
        handleExpandAllSections,
        handleAddNotes,
        handleAddResponses,
        handleDeleteAllResponses,
        handleDeleteAllNotes,
        handleDeleteAllSectionResponses,
        handleDeleteAllSectionNotes,
        handleDuplicateChecklistItem,
        handleGlobalChecklistCommand,
        updateHistory, // Expose for the IPC hook
    };
};