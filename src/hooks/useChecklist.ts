import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Word, ChecklistItem, ChecklistSection, InboxMessage, Settings, TimeLogEntry, ChecklistTemplate } from '../types';
import { extractUrlFromText, formatChecklistForCopy, formatDate, formatTime } from '../utils';

interface UseChecklistProps {
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
    activeTimerEntry: TimeLogEntry | null;
    activeTimerLiveTime: number;
    handlePrimeTaskWithNewLog: (wordId: number, newTimeLog: TimeLogEntry[], timeLogTitle?: string) => void;
}

export const useChecklist = ({
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
}: UseChecklistProps) => {
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

    const updateHistory = (newSections: ChecklistSection[]) => {
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
    }, [history, historyIndex, handleExpandAllSections, handleCollapseAllSections, handleAddNotes, handleAddResponses, handleDeleteAllNotes, handleDeleteAllResponses, handleDeleteAllSections, handleSendAllItemsToTimer, showToast, setTemplateSectionsToSave, setIsSaveTemplatePromptOpen, onUpdate]);

    return {
        newItemTexts, setNewItemTexts,
        editingSectionId, setEditingSectionId,
        editingSectionTitle, setEditingSectionTitle,
        editingItemId, setEditingItemId,
        editingItemText, setEditingItemText,
        editingResponseForItemId, setEditingResponseForItemId,
        editingNoteForItemId, setEditingNoteForItemId,
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