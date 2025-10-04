import React, { useState, useEffect, useRef } from 'react';
import { Task, ChecklistItem, ChecklistSection, InboxMessage, Settings, TimeLogEntry, ChecklistTemplate, RichTextBlock } from '../types';
import { PromptModal } from './Editors';
import './styles/Checklist.css';
import { ChecklistHeader } from './ChecklistHeader';
import { ChecklistSectionComponent } from './ChecklistSection';
import { useChecklist } from '../hooks/useChecklist';
import { RichTextBlockComponent } from './RichTextBlockComponent';
import { ManageTemplatesModal } from './ManageTemplatesModal';

interface ChecklistProps {
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
  activeTimerEntry: TimeLogEntry | null; // Add for live time display
  activeTimerLiveTime: number; // Add for live time display
  handlePrimeTaskWithNewLog: (taskId: number, newTimeLog: TimeLogEntry[], timeLogTitle?: string) => void;
}

export function Checklist({ 
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
}: ChecklistProps) {
  const {
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
    subInputRefs,
    hiddenNotesSections,
    hiddenResponsesSections,
    confirmingDeleteSectionNotes, setConfirmingDeleteSectionNotes,
    confirmingDeleteSectionResponses, setConfirmingDeleteSectionResponses,
    confirmingDeleteNotes, setConfirmingDeleteNotes,
    confirmingDeleteAllSections,
    confirmingDeleteResponses, setConfirmingDeleteResponses,
    confirmingDeleteSectionId,
    confirmingDeleteChecked,
    confirmTimeoutRef,
    addItemInputRef,
    bulkAddChecklistText, setBulkAddChecklistText,
    isSaveTemplatePromptOpen, setIsSaveTemplatePromptOpen,
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
    handleSortChange,
    sortedSections,
    handleIndentChecked,
    handleIndent,
    handleTabOnChecklistItem,
    handleOutdent,
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
    updateHistory,
    setFocusSubInputKey,
  } = useChecklist({ sections, onUpdate, isEditable, onComplete, tasks, setInboxMessages, task, taskId,
    onTaskUpdate, checklistRef, showToast, focusItemId, onFocusHandled, settings,
    onSettingsChange, handleGlobalToggleTimer, handleClearActiveTimer, handlePrimeTask,
    handlePrimeTaskWithNewLog, activeTimerEntry, activeTimerLiveTime
  });

  return (
    <div className="checklist-container">
      <PromptModal
        isOpen={isSaveTemplatePromptOpen}
        onClose={() => setIsSaveTemplatePromptOpen(false)}
        onConfirm={handleSaveChecklistTemplate}
        title="Save as Template"
        placeholder="Enter template name..."
      />
      <ChecklistHeader
        taskId={taskId}
        settings={settings}
        history={history}
        historyIndex={historyIndex}
        isEditable={isEditable}
        confirmingDeleteChecked={confirmingDeleteChecked}
        confirmingDeleteResponses={confirmingDeleteResponses}
        confirmingDeleteNotes={confirmingDeleteNotes}
        confirmingDeleteAllSections={confirmingDeleteAllSections}
        confirmTimeoutRef={confirmTimeoutRef}
        onDeleteChecked={handleDeleteChecked}
        onToggleAllSections={handleToggleAllSections}
        onSendAllItemsToTimer={handleSendAllItemsToTimer}
        onExpandAllSections={handleExpandAllSections}
        onCollapseAllSections={handleCollapseAllSections}
        onAddResponses={handleAddResponses}
        onSettingsChange={onSettingsChange}
        onDeleteAllResponses={handleDeleteAllResponses}
        onAddNotes={handleAddNotes}
        onDeleteAllNotes={handleDeleteAllNotes}
        showToast={showToast}
        onGlobalChecklistCommand={handleGlobalChecklistCommand}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSortChange={handleSortChange}
        onIndentChecked={handleIndentChecked}
        onDeleteAllSections={handleDeleteAllSections}
        setConfirmingDeleteResponses={setConfirmingDeleteResponses}
        setConfirmingDeleteNotes={setConfirmingDeleteNotes}
      />
      {(() => {
        const renderedBlocks = [];
        for (let i = 0; i < sortedSections.length; i++) {
          const currentBlock = sortedSections[i];

          // Case 1: A RichTextBlock
          if ('type' in currentBlock) {
            // Find all consecutive ChecklistSections that follow this RichTextBlock
            const associatedSections: ChecklistSection[] = [];
            let j = i + 1;
            while (j < sortedSections.length && !('type' in sortedSections[j])) {
              associatedSections.push(sortedSections[j] as ChecklistSection);
              j++;
            }

            renderedBlocks.push(
              <div key={currentBlock.id} className={associatedSections.length > 0 ? "checklist-section-container" : ""}>
                <RichTextBlockComponent
                  block={currentBlock}
                  isEditable={isEditable}
                  onUpdate={handleUpdateRichTextBlockContent}
                  onDelete={handleDeleteRichTextBlock}
                  settings={settings}
                  onCopy={handleCopyBlock}
                  onCopyRaw={handleCopyBlockRaw}
                  onMove={handleMoveBlock} // Note: onMove might need adjustment for multi-section groups
                  onSettingsChange={onSettingsChange}
                  isEditing={editingContentBlockId === currentBlock.id}
                  onSetEditing={setEditingContentBlockId}
                  editorKey={`rtb-${currentBlock.id}`}
                />
                {associatedSections.map(section => (
                  <ChecklistSectionComponent
                    key={section.id}
                    section={section}
                    taskId={taskId} isEditable={isEditable} settings={settings} history={history} historyIndex={historyIndex}
                    timeLogDurations={timeLogDurations} editingItemId={editingItemId} editingItemText={editingItemText}
                    editingResponseForItemId={editingResponseForItemId} editingNoteForItemId={editingNoteForItemId}
                    editingSectionId={editingSectionId} editingSectionTitle={editingSectionTitle} hiddenNotesSections={hiddenNotesSections}
                    hiddenResponsesSections={hiddenResponsesSections} confirmingDeleteSectionId={confirmingDeleteSectionId}
                    confirmingDeleteChecked={confirmingDeleteChecked} confirmingDeleteSectionResponses={confirmingDeleteSectionResponses}
                    confirmingDeleteSectionNotes={confirmingDeleteSectionNotes} newItemTexts={newItemTexts}
                    editingItemInputRef={editingItemInputRef} subInputRefs={subInputRefs} addItemInputRef={addItemInputRef}
                    confirmTimeoutRef={confirmTimeoutRef} onUpdate={onUpdate} showToast={showToast} onToggleItem={handleToggleItem}
                    onUpdateItemText={handleUpdateItemText} onUpdateItemResponse={handleUpdateItemResponse} onUpdateItemNote={handleUpdateItemNote}
                    onDeleteItemResponse={handleDeleteItemResponse} onDeleteItemNote={handleDeleteItemNote} onDeleteItem={handleDeleteItem}
                    onUpdateItemDueDateFromPicker={handleUpdateItemDueDateFromPicker} onUpdateItemDueDate={handleUpdateItemDueDate}
                    contentBlockId={currentBlock.id}
                    onSendToTimer={handleSendToTimer} onDuplicateChecklistItem={handleDuplicateChecklistItem} onSetEditingItemId={setEditingItemId}
                    onSetEditingItemText={setEditingItemText} onSetEditingResponseForItemId={setEditingResponseForItemId}
                    onSetEditingNoteForItemId={setEditingNoteForItemId} onSetFocusSubInputKey={setFocusSubInputKey}
                    onIndent={(itemId) => handleIndent(section.id, itemId)} onOutdent={(itemId) => handleOutdent(section.id, itemId)}
                    onTab={(itemId, shiftKey) => handleTabOnChecklistItem(section.id, itemId, shiftKey)}
                    onToggleSectionCollapse={handleToggleSectionCollapse} onSetEditingSectionId={setEditingSectionId}
                    onSetEditingSectionTitle={setEditingSectionTitle} onUpdateSectionTitle={handleUpdateSectionTitle}
                    onDeleteChecked={handleDeleteChecked} onCompleteAllInSection={handleCompleteAllInSection}
                    onSendSectionToTimer={handleSendSectionToTimer} onAddResponses={handleAddResponses}
                    onToggleSectionResponses={handleToggleSectionResponses} onDeleteAllSectionResponses={handleDeleteAllSectionResponses}
                    onAddNotes={handleAddNotes} onToggleSectionNotes={handleToggleSectionNotes} onDeleteAllSectionNotes={handleDeleteAllSectionNotes}
                    onDuplicateSection={handleDuplicateSection} onAddRichTextBlock={handleAddRichTextBlock} onDeleteSection={handleDeleteSection}
                    onAddItem={handleAddItem} onSetNewItemTexts={setNewItemTexts} moveSection={moveSection}
                    setConfirmingDeleteSectionResponses={setConfirmingDeleteSectionResponses} setConfirmingDeleteSectionNotes={setConfirmingDeleteSectionNotes}
                  />
                ))}
              </div>
            );
            // Skip the sections we just rendered
            i += associatedSections.length;
            continue;
          }

          // Case 2: A standalone ChecklistSection (not preceded by a RichTextBlock)
          if (!('type' in currentBlock)) {
            renderedBlocks.push(<ChecklistSectionComponent key={currentBlock.id} section={currentBlock as ChecklistSection} taskId={taskId} isEditable={isEditable} settings={settings} history={history} historyIndex={historyIndex} timeLogDurations={timeLogDurations} editingItemId={editingItemId} editingItemText={editingItemText} editingResponseForItemId={editingResponseForItemId} editingNoteForItemId={editingNoteForItemId} editingSectionId={editingSectionId} editingSectionTitle={editingSectionTitle} hiddenNotesSections={hiddenNotesSections} hiddenResponsesSections={hiddenResponsesSections} confirmingDeleteSectionId={confirmingDeleteSectionId} confirmingDeleteChecked={confirmingDeleteChecked} confirmingDeleteSectionResponses={confirmingDeleteSectionResponses} confirmingDeleteSectionNotes={confirmingDeleteSectionNotes} newItemTexts={newItemTexts} editingItemInputRef={editingItemInputRef} subInputRefs={subInputRefs} addItemInputRef={addItemInputRef} confirmTimeoutRef={confirmTimeoutRef} onUpdate={onUpdate} showToast={showToast} onToggleItem={handleToggleItem} onUpdateItemText={handleUpdateItemText} onUpdateItemResponse={handleUpdateItemResponse} onUpdateItemNote={handleUpdateItemNote} onDeleteItemResponse={handleDeleteItemResponse} onDeleteItemNote={handleDeleteItemNote} onDeleteItem={handleDeleteItem} onUpdateItemDueDateFromPicker={handleUpdateItemDueDateFromPicker} onUpdateItemDueDate={handleUpdateItemDueDate} contentBlockId={null} 
            onSendToTimer={handleSendToTimer}
            onDuplicateChecklistItem={handleDuplicateChecklistItem}
            onSetEditingItemId={setEditingItemId}
            onSetEditingItemText={setEditingItemText}
            onSetEditingResponseForItemId={setEditingResponseForItemId}
            onSetEditingNoteForItemId={setEditingNoteForItemId}
            onSetFocusSubInputKey={setFocusSubInputKey}
            onIndent={(itemId) => handleIndent(currentBlock.id, itemId)}
            onOutdent={(itemId) => handleOutdent(currentBlock.id, itemId)}
            onTab={(itemId, shiftKey) => handleTabOnChecklistItem(currentBlock.id, itemId, shiftKey)}
            onToggleSectionCollapse={handleToggleSectionCollapse} onSetEditingSectionId={setEditingSectionId}
            onSetEditingSectionTitle={setEditingSectionTitle} onUpdateSectionTitle={handleUpdateSectionTitle}
            onDeleteChecked={handleDeleteChecked} onCompleteAllInSection={handleCompleteAllInSection}
            onSendSectionToTimer={handleSendSectionToTimer} onAddResponses={handleAddResponses}
            onToggleSectionResponses={handleToggleSectionResponses} onDeleteAllSectionResponses={handleDeleteAllSectionResponses}
            onAddNotes={handleAddNotes} onToggleSectionNotes={handleToggleSectionNotes} onDeleteAllSectionNotes={handleDeleteAllSectionNotes}
            onDuplicateSection={handleDuplicateSection} onAddRichTextBlock={handleAddRichTextBlock} onDeleteSection={handleDeleteSection}
            onAddItem={handleAddItem} onSetNewItemTexts={setNewItemTexts} moveSection={moveSection}
            setConfirmingDeleteSectionResponses={setConfirmingDeleteSectionResponses} setConfirmingDeleteSectionNotes={setConfirmingDeleteSectionNotes} />);
          }
        }
        return renderedBlocks;
      })()}
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