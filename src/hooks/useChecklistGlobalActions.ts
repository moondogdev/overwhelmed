import { useCallback } from 'react';
import { ChecklistItem, ChecklistSection, RichTextBlock, Settings, ChecklistTemplate } from '../types';
import { formatChecklistForCopy, formatChecklistItemsForRawCopy } from '../utils';

interface UseChecklistGlobalActionsProps {
    history: (ChecklistSection | RichTextBlock)[][];
    historyIndex: number;
    settings: Settings;
    bulkAddChecklistText: string;
    templateSectionsToSave: ChecklistSection[] | null;
    confirmingDeleteChecked: number | 'all' | null;
    confirmTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;

    updateHistory: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    onUpdate: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
    showToast: (message: string, duration?: number) => void;

    // State Setters
    setBulkAddChecklistText: React.Dispatch<React.SetStateAction<string>>;
    setTemplateSectionsToSave: React.Dispatch<React.SetStateAction<ChecklistSection[] | null>>;
    setIsSaveTemplatePromptOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setConfirmingDeleteChecked: React.Dispatch<React.SetStateAction<number | 'all' | null>>;
    setConfirmingDeleteSectionId: React.Dispatch<React.SetStateAction<number | null>>;
    setConfirmingDeleteNotes: React.Dispatch<React.SetStateAction<boolean>>;
    setConfirmingDeleteResponses: React.Dispatch<React.SetStateAction<boolean>>;
    setConfirmingDeleteSectionNotes: React.Dispatch<React.SetStateAction<number | null>>;
    setConfirmingDeleteSectionResponses: React.Dispatch<React.SetStateAction<number | null>>;
    setConfirmingDeleteAllSections: React.Dispatch<React.SetStateAction<boolean>>;

    // Other Handlers needed for dispatching
    handleExpandAllSections: () => void;
    handleCollapseAllSections: () => void;
    handleAddNotes: (sectionId?: number) => void;
    handleAddResponses: (sectionId?: number) => void;
    handleDeleteAllNotes: () => void;
    handleDeleteAllResponses: () => void;
    handleDeleteAllSections: () => void;
    handleSendAllItemsToTimer: (startImmediately: boolean) => void;
}

export const useChecklistGlobalActions = ({
    history, historyIndex, settings, bulkAddChecklistText, templateSectionsToSave, confirmingDeleteChecked, confirmTimeoutRef,
    updateHistory, onUpdate, onSettingsChange, showToast,
    setBulkAddChecklistText, setTemplateSectionsToSave, setIsSaveTemplatePromptOpen,
    setConfirmingDeleteChecked, setConfirmingDeleteSectionId, setConfirmingDeleteNotes, setConfirmingDeleteResponses,
    setConfirmingDeleteSectionNotes, setConfirmingDeleteSectionResponses, setConfirmingDeleteAllSections,
    handleExpandAllSections, handleCollapseAllSections, handleAddNotes, handleAddResponses,
    handleDeleteAllNotes, handleDeleteAllResponses, handleDeleteAllSections, handleSendAllItemsToTimer
}: UseChecklistGlobalActionsProps) => {

    const handleBulkAddChecklist = useCallback(() => {
        if (!bulkAddChecklistText.trim()) return;
        const blocksToAdd: (ChecklistSection | RichTextBlock)[] = [];
        const sections = bulkAddChecklistText.split('\n---\n');
        for (const sectionText of sections) {
            const trimmedSection = sectionText.trim();
            if (!trimmedSection) continue;
            if (trimmedSection.startsWith('<div>') && trimmedSection.endsWith('</div>')) {
                blocksToAdd.push({ id: Date.now() + Math.random(), type: 'rich-text', content: trimmedSection.slice(5, -6) });
                continue;
            }
            const lines = trimmedSection.split('\n');
            if (lines[0].trim().startsWith('###')) {
                const newSection: ChecklistSection = { id: Date.now() + Math.random(), title: lines[0].trim().substring(3).trim(), items: [] };
                const parentStack: (number | null)[] = [null];
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const indentMatch = lines[i].match(/^(\s*|-+|\*+)\s*/);
                    const indent = indentMatch ? indentMatch[1] : '';
                    const level = indent.includes('-') || indent.includes('*') ? 1 : Math.floor(indent.length / 2);
                    const newItem: ChecklistItem = { id: Date.now() + Math.random(), text: lines[i].trim().replace(/^(-|\*)\s*/, ''), isCompleted: false, level: level, parentId: level > 0 ? parentStack[level - 1] : null };
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
        setBulkAddChecklistText('');
        showToast(`${blocksToAdd.length} block(s) added!`);
    }, [bulkAddChecklistText, history, historyIndex, updateHistory, onUpdate, setBulkAddChecklistText, showToast]);

    const handleLoadChecklistTemplate = useCallback((templateId: number) => {
        if (!templateId) return;
        const template = settings.checklistTemplates?.find(t => t.id === templateId);
        if (!template) { showToast('Template not found.'); return; }
        const newSectionsFromTemplate: ChecklistSection[] = template.sections.map(section => ({ ...section, id: Date.now() + Math.random(), items: section.items.map(item => ({ ...item, id: Date.now() + Math.random(), isCompleted: false })) }));
        const newSections = [...history[historyIndex], ...newSectionsFromTemplate];
        updateHistory(newSections);
        onUpdate(newSections);
        showToast(`Template "${template.name}" loaded!`);
    }, [settings.checklistTemplates, history, historyIndex, updateHistory, onUpdate, showToast]);

    const handleDeleteChecked = useCallback((sectionId?: number) => {
        const confirmKey = sectionId === undefined ? 'all' : sectionId;
        if (confirmingDeleteChecked === confirmKey) {
            const newSections = history[historyIndex].map(sec => ('items' in sec && (sectionId === undefined || sec.id === sectionId)) ? { ...sec, items: sec.items.filter(item => !item.isCompleted) } : sec);
            updateHistory(newSections);
            onUpdate(newSections);
            showToast('Checked items deleted.');
            setConfirmingDeleteChecked(null);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        } else {
            setConfirmingDeleteChecked(confirmKey);
            setConfirmingDeleteSectionId(null); setConfirmingDeleteNotes(false); setConfirmingDeleteResponses(false);
            setConfirmingDeleteSectionNotes(null); setConfirmingDeleteSectionResponses(null); setConfirmingDeleteAllSections(false);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteChecked(null), 3000);
        }
    }, [confirmingDeleteChecked, history, historyIndex, updateHistory, onUpdate, showToast, setConfirmingDeleteChecked, setConfirmingDeleteSectionId, setConfirmingDeleteNotes, setConfirmingDeleteResponses, setConfirmingDeleteSectionNotes, setConfirmingDeleteSectionResponses, setConfirmingDeleteAllSections, confirmTimeoutRef]);

    const handleSaveChecklistTemplate = useCallback((templateName: string) => {
        if (!templateName.trim() || !templateSectionsToSave) return;
        const newTemplate: ChecklistTemplate = { id: Date.now(), name: templateName.trim(), sections: templateSectionsToSave };
        onSettingsChange(prevSettings => ({ ...prevSettings, checklistTemplates: [...(prevSettings.checklistTemplates || []), newTemplate] }));
        showToast(`Template "${templateName.trim()}" saved!`);
        setIsSaveTemplatePromptOpen(false);
        setTemplateSectionsToSave(null);
    }, [templateSectionsToSave, onSettingsChange, showToast, setIsSaveTemplatePromptOpen, setTemplateSectionsToSave]);

    const handleGlobalChecklistCommand = useCallback((payload: { command: string }) => {
        switch (payload.command) {
            case 'expand_all_header ': case 'expand_all_section': handleExpandAllSections(); break;
            case 'collapse_all': handleCollapseAllSections(); break;
            case 'add_note_to_all': handleAddNotes(); break;
            case 'add_response_to_all': handleAddResponses(); break;
            case 'delete_all_notes': handleDeleteAllNotes(); break;
            case 'delete_all_responses': handleDeleteAllResponses(); break;
            case 'delete_all_sections': handleDeleteAllSections(); break;
            case 'copy_all_sections': { const sectionsToCopy = history[historyIndex].filter(s => 'items' in s) as ChecklistSection[]; navigator.clipboard.writeText(formatChecklistForCopy(sectionsToCopy)); showToast('All sections copied to clipboard!'); break; }
            case 'copy_all_sections_raw': { const allRawText = history[historyIndex].map(block => ('items' in block) ? `### ${block.title}\n${formatChecklistItemsForRawCopy(block.items)}` : `<div>${block.content}</div>`).join('\n---\n'); navigator.clipboard.writeText(allRawText); showToast('All sections raw content copied!'); break; }
            case 'save_checklist_as_template': { const sectionsOnly = history[historyIndex].filter(s => 'items' in s) as ChecklistSection[]; setTemplateSectionsToSave(sectionsOnly); setIsSaveTemplatePromptOpen(true); break; }
            case 'clear_all_highlights': { const newSections = history[historyIndex].map(sec => 'items' in sec ? { ...sec, items: sec.items.map(item => ({ ...item, highlightColor: undefined } as ChecklistItem)) } : sec); updateHistory(newSections); onUpdate(newSections); showToast('All highlights cleared.'); break; }
            default: break;
        }
    }, [history, historyIndex, handleExpandAllSections, handleCollapseAllSections, handleAddNotes, handleAddResponses, handleDeleteAllNotes, handleDeleteAllResponses, handleDeleteAllSections, handleSendAllItemsToTimer, showToast, setTemplateSectionsToSave, setIsSaveTemplatePromptOpen, onUpdate]);

    return { handleBulkAddChecklist, handleLoadChecklistTemplate, handleDeleteChecked, handleSaveChecklistTemplate, handleGlobalChecklistCommand };
};