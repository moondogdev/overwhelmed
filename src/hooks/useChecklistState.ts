import React, { useState, useRef, useEffect } from 'react';
import { ChecklistItem, ChecklistSection, RichTextBlock } from '../types';

interface UseChecklistStateProps {
    normalizedSections: (ChecklistSection | RichTextBlock)[];
    taskId: number;
}

export const useChecklistState = ({ normalizedSections, taskId }: UseChecklistStateProps) => {
    // --- Core State ---
    const [history, setHistory] = useState<(ChecklistSection | RichTextBlock)[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // --- Editing State ---
    const [newItemTexts, setNewItemTexts] = useState<{ [key: number]: string }>({});
    const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
    const [editingSectionTitle, setEditingSectionTitle] = useState('');
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editingItemText, setEditingItemText] = useState('');
    const [editingResponseForItemId, setEditingResponseForItemId] = useState<number | null>(null);
    const [editingNoteForItemId, setEditingNoteForItemId] = useState<number | null>(null);
    const [editingContentBlockId, setEditingContentBlockId] = useState<number | null>(null);

    // --- UI / Focus State ---
    const [focusSubInputKey, setFocusSubInputKey] = useState<string | null>(null);
    const [focusEditorKey, setFocusEditorKey] = useState<string | null>(null);
    const [hiddenNotesSections, setHiddenNotesSections] = useState<Set<number>>(new Set());
    const [hiddenResponsesSections, setHiddenResponsesSections] = useState<Set<number>>(new Set());
    const [checklistSortKey, setChecklistSortKey] = useState<'default' | 'alphabetical' | 'highlight' | 'status'>('default');

    // --- Confirmation State ---
    const [confirmingDeleteSectionNotes, setConfirmingDeleteSectionNotes] = useState<number | null>(null);
    const [confirmingDeleteSectionResponses, setConfirmingDeleteSectionResponses] = useState<number | null>(null);
    const [confirmingDeleteNotes, setConfirmingDeleteNotes] = useState(false);
    const [confirmingDeleteAllSections, setConfirmingDeleteAllSections] = useState(false);
    const [confirmingDeleteResponses, setConfirmingDeleteResponses] = useState(false);
    const [confirmingDeleteSectionId, setConfirmingDeleteSectionId] = useState<number | null>(null);
    const [confirmingDeleteChecked, setConfirmingDeleteChecked] = useState<number | 'all' | null>(null);

    // --- Template & Bulk Add State ---
    const [bulkAddChecklistText, setBulkAddChecklistText] = useState('');
    const [isSaveTemplatePromptOpen, setIsSaveTemplatePromptOpen] = useState(false);
    const [templateSectionsToSave, setTemplateSectionsToSave] = useState<ChecklistSection[] | null>(null);
    const [isManageTemplatesOpen, setIsManageTemplatesOpen] = useState(false);

    // --- Refs ---
    const subInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});
    const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const addItemInputRef = useRef<{ [key: number]: HTMLTextAreaElement }>({});
    const isUndoingRedoing = useRef(false);
    const historyRef = useRef(history);
    historyRef.current = history; // Keep the ref updated on every render
    const editingItemInputRef = useRef<HTMLInputElement | null>(null);

    // --- Effects for State Initialization ---
    useEffect(() => {
        setHistory([normalizedSections]);
        setHistoryIndex(0);
    }, [taskId]); // Re-initialize history only when the task itself changes

    // --- Core State Logic ---
    const updateHistory = (newSections: (ChecklistSection | RichTextBlock)[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newSections]);
        setHistoryIndex(newHistory.length);
    };

    return {
        history, setHistory,
        historyIndex, setHistoryIndex,
        newItemTexts, setNewItemTexts,
        editingSectionId, setEditingSectionId,
        editingSectionTitle, setEditingSectionTitle,
        editingItemId, setEditingItemId,
        editingItemText, setEditingItemText,
        editingResponseForItemId, setEditingResponseForItemId,
        editingNoteForItemId, setEditingNoteForItemId,
        editingContentBlockId, setEditingContentBlockId,
        focusSubInputKey, setFocusSubInputKey,
        focusEditorKey, setFocusEditorKey,
        hiddenNotesSections, setHiddenNotesSections,
        hiddenResponsesSections, setHiddenResponsesSections,
        checklistSortKey, setChecklistSortKey,
        confirmingDeleteSectionNotes, setConfirmingDeleteSectionNotes,
        confirmingDeleteSectionResponses, setConfirmingDeleteSectionResponses,
        confirmingDeleteNotes, setConfirmingDeleteNotes,
        confirmingDeleteAllSections, setConfirmingDeleteAllSections,
        confirmingDeleteResponses, setConfirmingDeleteResponses,
        confirmingDeleteSectionId, setConfirmingDeleteSectionId,
        confirmingDeleteChecked, setConfirmingDeleteChecked,
        bulkAddChecklistText, setBulkAddChecklistText,
        isSaveTemplatePromptOpen, setIsSaveTemplatePromptOpen,
        templateSectionsToSave, setTemplateSectionsToSave,
        isManageTemplatesOpen, setIsManageTemplatesOpen,
        subInputRefs, confirmTimeoutRef, addItemInputRef, isUndoingRedoing, historyRef, editingItemInputRef,
        updateHistory,
    };
};