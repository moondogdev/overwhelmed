import React from 'react';
import { Task, Settings } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { getRelativeDateHeader } from '../utils';
import { TaskAccordion, TaskAccordionHeader, Dropdown } from './TaskComponents';
import { TabbedView } from './TaskView';

interface TaskListProps {
    filteredTasks: Task[];
    isTransactionsView: boolean;
    transactionTotal: number;
    selectAllCheckboxRef: React.RefObject<HTMLInputElement>;
    allVisibleSelected: boolean;
    handleToggleSelectAll: () => void;
    handleCopyTransactionTitlesAsKeywords: () => void;
    handleCopyFilteredDetails: () => void;
    handleCopyFilteredTitles: () => void;
    handleCopyTitlesByCategory: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
    filteredTasks, isTransactionsView, transactionTotal, selectAllCheckboxRef, allVisibleSelected,
    handleToggleSelectAll, handleCopyTransactionTitlesAsKeywords, handleCopyFilteredDetails,
    handleCopyFilteredTitles, handleCopyTitlesByCategory
}) => {
    const {
        settings, setSettings, handleClearAll, handleCopyList, editingTaskId, editingText, handleEditChange,
        handleEditKeyDown, setEditingTaskId, handleAccordionToggle, completedTasks, handleTaskUpdate,
        activeTaxCategoryId, setActiveTaxCategoryId, handleTimerNotify, selectedTaskIds, handleToggleTaskSelection,
        tasks, setActiveCategoryId, setActiveSubCategoryId, setFullTaskViewId, setTasks, showToast,
        handleCompleteTask, moveTask, removeTask, focusAddTaskInput, setNewTask
    } = useAppContext();

    const { activeCategoryId, activeSubCategoryId } = settings;

    if (filteredTasks.length === 0) {
        return (
            <div className="empty-list-placeholder">
                <h3>No Open Tasks for {(() => { if (activeCategoryId === 'all') return 'any category'; if (activeSubCategoryId !== 'all') { return settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'this category'; } const parentCategory = settings.categories.find(c => c.id === activeCategoryId); return parentCategory?.name || 'this category'; })()}</h3>
                <button onClick={() => { focusAddTaskInput(); const defaultCategoryId = activeSubCategoryId !== 'all' ? activeSubCategoryId : (activeCategoryId !== 'all' ? activeCategoryId : undefined); if (defaultCategoryId) { ; setNewTask(prev => ({ ...prev, categoryId: defaultCategoryId })); } }}><i className="fas fa-plus"></i> Open Task</button>
            </div>
        );
    }

    return (
        <>
            <div className="list-header">
                <h3>
                    {(() => {
                        if (activeCategoryId === 'all') return 'All Open Tasks';
                        if (activeSubCategoryId !== 'all') { return `${settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'Sub-Category'}: Priority List`; }
                        const parentCategory = settings.categories.find(c => c.id === activeCategoryId);;
                        return `${parentCategory?.name || 'Category'}: Priority List`;
                    })()} ({filteredTasks.length})
                    {isTransactionsView && (<span className={`transaction-total-pill ${transactionTotal >= 0 ? 'income' : 'expense'}`}>Total: ${transactionTotal.toFixed(2)}</span>)}
                </h3>
                <div className="list-header-actions" onContextMenu={(e) => { e.stopPropagation(); }}>
                    <button className="icon-button" onClick={handleClearAll} title="Clear All Tasks"><i className="fas fa-trash"></i></button>
                    <input type="checkbox" ref={selectAllCheckboxRef} checked={allVisibleSelected} onChange={handleToggleSelectAll} title={allVisibleSelected ? "Deselect All Visible" : "Select All Visible"} />
                    {isTransactionsView ? (<button className="icon-button" onClick={handleCopyTransactionTitlesAsKeywords} title="Copy Visible Titles as Keywords"><i className="fas fa-quote-right"></i></button>) : null}
                    {!isTransactionsView ? (<button className="icon-button" onClick={handleCopyFilteredDetails} title="Copy Details for Visible Tasks"><i className="fas fa-clipboard-list"></i></button>) : null}
                    {!isTransactionsView ? (<button className="icon-button" onClick={handleCopyFilteredTitles} title="Copy Titles for Visible Tasks"><i className="fas fa-list-ul"></i></button>) : null}
                    {!isTransactionsView ? (<button className="icon-button" onClick={handleCopyTitlesByCategory} title="Copy Titles Grouped by Category"><i className="fas fa-sitemap"></i></button>) : null}
                    <button className="icon-button" onClick={handleCopyList} title="Copy Task List Summary"><i className="fas fa-copy"></i></button>
                </div>
                <div className="button-group">
                    <button className="icon-button" onClick={() => { const allVisibleIds = filteredTasks.map(t => t.id); setSettings(prev => ({ ...prev, openAccordionIds: allVisibleIds })) }} title="Expand All"><i className="fas fa-folder-open"></i></button>
                    <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, openAccordionIds: [] }))} title="Collapse All"><i className="fas fa-folder"></i></button>
                </div>
            </div>

            <div className="priority-list-main">
                {settings.prioritySortConfig?.[String(activeCategoryId)]?.key === 'completeBy' && settings.prioritySortConfig?.[String(activeCategoryId)]?.direction === 'asc' ? (
                    (() => {
                        const tasksByDate = filteredTasks.reduce((acc, task: Task) => {
                            let date = '0000-no-due-date';
                            if (task.completeBy) { const d = new Date(task.completeBy); date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
                            if (!acc[date]) acc[date] = [];
                            acc[date].push(task);
                            return acc;
                        }, {} as Record<string, Task[]>);

                        const sortedDates = Object.keys(tasksByDate).sort();

                        return sortedDates.map(dateStr => {
                            const tasksOnDate = tasksByDate[dateStr];
                            const isNoDueDate = dateStr === '0000-no-due-date';
                            let headerText = isNoDueDate ? 'No Due Date' : getRelativeDateHeader(dateStr);
                            const taskCountText = `(${tasksOnDate.length} ${tasksOnDate.length === 1 ? 'task' : 'tasks'})`;
                            return (
                                <div key={dateStr} className="date-group-container">
                                    <h4 className={`date-group-header ${isNoDueDate ? 'no-due-date-header' : ''}`}>{headerText} <span className="date-group-task-count">{taskCountText}</span></h4>
                                    {tasksOnDate.map((task, index) => (
                                        <div key={task.id} className="priority-list-item" data-task-id={task.id}>
                                            {editingTaskId === task.id ? (<input type="text" value={editingText} onChange={handleEditChange} onKeyDown={(e) => handleEditKeyDown(e, task.id)} onBlur={() => setEditingTaskId(null)} autoFocus />) : (
                                                <TaskAccordion task={task} isOpen={settings.openAccordionIds.includes(task.id)} onToggle={() => handleAccordionToggle(task.id)} settings={settings} completedTasks={completedTasks} onUpdate={(updatedTask, options) => { handleTaskUpdate(updatedTask); if (options?.action === 'tax-uncategorize' && activeTaxCategoryId !== 'all' && filteredTasks.length === 1) { setActiveTaxCategoryId('all'); } }} onNotify={(task) => handleTimerNotify(task, 'Timer notification')} title={<TaskAccordionHeader task={task} settings={settings} onCategoryClick={(e, catId, parentId) => { e.stopPropagation(); setActiveCategoryId(parentId || catId); if (parentId) { setActiveSubCategoryId(catId); } else { setActiveSubCategoryId('all'); } }} allTasks={[...tasks, ...completedTasks]} onUpdate={handleTaskUpdate} onNotify={(task) => handleTimerNotify(task, 'Timer notification')} isSelected={selectedTaskIds.includes(task.id)} onToggleSelection={handleToggleTaskSelection} />}>
                                                    <><TabbedView task={task} onUpdate={handleTaskUpdate} onSettingsChange={setSettings} /></>
                                                    <div className="list-item-controls">
                                                        {!isTransactionsView && (<><button onClick={() => { const newAutocompleteState = !task.isAutocomplete; setTasks(tasks.map(t => t.id === task.id ? { ...t, isAutocomplete: newAutocompleteState } : t)); showToast(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`); }} title="Toggle Autocomplete" className={`icon-button recurring-toggle ${task.isAutocomplete ? 'active' : ''}`}><i className="fas fa-robot"></i></button><Dropdown trigger={<button title="Recurring Options" className={`icon-button recurring-toggle ${task.isRecurring || task.isDailyRecurring || task.isWeeklyRecurring || task.isMonthlyRecurring || task.isYearlyRecurring ? 'active' : ''}`}><i className="fas fa-sync-alt"></i></button>}><button onClick={() => handleTaskUpdate({ ...task, isRecurring: !task.isRecurring })} className={task.isRecurring ? 'active' : ''}>Re-occur on Complete</button><button onClick={() => handleTaskUpdate({ ...task, isDailyRecurring: !task.isDailyRecurring })} className={task.isDailyRecurring ? 'active' : ''}>Repeat Daily</button><button onClick={() => handleTaskUpdate({ ...task, isWeeklyRecurring: !task.isWeeklyRecurring })} className={task.isWeeklyRecurring ? 'active' : ''}>Repeat Weekly</button><button onClick={() => handleTaskUpdate({ ...task, isMonthlyRecurring: !task.isMonthlyRecurring })} className={task.isMonthlyRecurring ? 'active' : ''}>Repeat Monthly</button><button onClick={() => handleTaskUpdate({ ...task, isYearlyRecurring: !task.isYearlyRecurring })} className={task.isYearlyRecurring ? 'active' : ''}>Repeat Yearly</button></Dropdown><button onClick={() => handleCompleteTask(task, 'skipped')} className="icon-button skip-btn" title="Skip Task"><i className="fas fa-forward"></i></button></>)}
                                                        <button className="icon-button" title="View Full Page" onClick={(e) => { e.stopPropagation(); setFullTaskViewId(task.id); }}><i className="fas fa-expand-arrows-alt"></i></button>
                                                        <button onClick={() => handleCompleteTask(task)} className="icon-button complete-btn" title="Complete Task"><i className="fas fa-check"></i></button>
                                                        {settings.prioritySortConfig?.[String(activeCategoryId)] === null && (<><button className="icon-button" onClick={() => { const targetTask = filteredTasks[index - 1]; if (targetTask) moveTask(task.id, targetTask.id); }} disabled={index === 0} title="Move Up"><i className="fas fa-arrow-up"></i></button><button onClick={() => { const targetTask = filteredTasks[index + 1]; if (targetTask) moveTask(task.id, targetTask.id); }} disabled={index === filteredTasks.length - 1} title="Move Down"><i className="fas fa-arrow-down"></i></button></>)}
                                                        <button onClick={() => removeTask(task.id)} className="icon-button remove-btn" title="Delete Task"><i className="fas fa-trash"></i></button>
                                                    </div>
                                                </TaskAccordion>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        });
                    })()
                ) : (filteredTasks.map((task, index) => (
                    <div key={task.id} className="priority-list-item" data-task-id={task.id}>
                        {editingTaskId === task.id ? (<input type="text" value={editingText} onChange={handleEditChange} onKeyDown={(e) => handleEditKeyDown(e, task.id)} onBlur={() => setEditingTaskId(null)} autoFocus />) : (
                            <TaskAccordion task={task} isOpen={settings.openAccordionIds.includes(task.id)} onToggle={() => handleAccordionToggle(task.id)} settings={settings} completedTasks={completedTasks} onUpdate={(updatedTask, options) => { handleTaskUpdate(updatedTask); if (options?.action === 'tax-uncategorize' && activeTaxCategoryId !== 'all' && filteredTasks.length === 1) { setActiveTaxCategoryId('all'); } }} onNotify={(task) => handleTimerNotify(task, 'Timer notification')} title={<TaskAccordionHeader task={task} settings={settings} onCategoryClick={(e, catId, parentId) => { e.stopPropagation(); setActiveCategoryId(parentId || catId); if (parentId) { setActiveSubCategoryId(catId); } else { setActiveSubCategoryId('all'); } }} allTasks={[...tasks, ...completedTasks]} onUpdate={handleTaskUpdate} onNotify={(task) => handleTimerNotify(task, 'Timer notification')} isSelected={selectedTaskIds.includes(task.id)} onToggleSelection={handleToggleTaskSelection} />}>
                                <><TabbedView task={task} onUpdate={handleTaskUpdate} onSettingsChange={setSettings} /></>
                                <div className="list-item-controls">
                                    {!isTransactionsView && (<><button onClick={() => { const newAutocompleteState = !task.isAutocomplete; setTasks(tasks.map(t => t.id === task.id ? { ...t, isAutocomplete: newAutocompleteState } : t)); showToast(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`); }} title="Toggle Autocomplete" className={`icon-button recurring-toggle ${task.isAutocomplete ? 'active' : ''}`}><i className="fas fa-robot"></i></button><Dropdown trigger={<button title="Recurring Options" className={`icon-button recurring-toggle ${task.isRecurring || task.isDailyRecurring || task.isWeeklyRecurring || task.isMonthlyRecurring || task.isYearlyRecurring ? 'active' : ''}`}><i className="fas fa-sync-alt"></i></button>}><button onClick={() => handleTaskUpdate({ ...task, isRecurring: !task.isRecurring })} className={task.isRecurring ? 'active' : ''}>Re-occur on Complete</button><button onClick={() => handleTaskUpdate({ ...task, isDailyRecurring: !task.isDailyRecurring })} className={task.isDailyRecurring ? 'active' : ''}>Repeat Daily</button><button onClick={() => handleTaskUpdate({ ...task, isWeeklyRecurring: !task.isWeeklyRecurring })} className={task.isWeeklyRecurring ? 'active' : ''}>Repeat Weekly</button><button onClick={() => handleTaskUpdate({ ...task, isMonthlyRecurring: !task.isMonthlyRecurring })} className={task.isMonthlyRecurring ? 'active' : ''}>Repeat Monthly</button><button onClick={() => handleTaskUpdate({ ...task, isYearlyRecurring: !task.isYearlyRecurring })} className={task.isYearlyRecurring ? 'active' : ''}>Repeat Yearly</button></Dropdown><button onClick={() => handleCompleteTask(task, 'skipped')} className="icon-button skip-btn" title="Skip Task"><i className="fas fa-forward"></i></button></>)}
                                    <button className="icon-button" title="View Full Page" onClick={(e) => { e.stopPropagation(); setFullTaskViewId(task.id); }}><i className="fas fa-expand-arrows-alt"></i></button>
                                    <button onClick={() => handleCompleteTask(task)} className="icon-button complete-btn" title="Complete Task"><i className="fas fa-check"></i></button>
                                    {settings.prioritySortConfig?.[String(activeCategoryId)] === null && (<><button className="icon-button" onClick={() => { const targetTask = filteredTasks[index - 1]; if (targetTask) moveTask(task.id, targetTask.id); }} disabled={index === 0} title="Move Up"><i className="fas fa-arrow-up"></i></button><button className="icon-button" onClick={() => { const targetTask = filteredTasks[index + 1]; if (targetTask) moveTask(task.id, targetTask.id); }} disabled={index === filteredTasks.length - 1} title="Move Down"><i className="fas fa-arrow-down"></i></button></>)}
                                    <button onClick={() => removeTask(task.id)} className="icon-button remove-btn" title="Delete Task"><i className="fas fa-trash"></i></button>
                                </div>
                            </TaskAccordion>
                        )}
                    </div>
                )))}
                <div className="add-task-row"><button className="add-task-button" onClick={() => { focusAddTaskInput(); const defaultCategoryId = activeSubCategoryId !== 'all' ? activeSubCategoryId : (activeCategoryId !== 'all' ? activeCategoryId : undefined);; if (defaultCategoryId) { setNewTask(prev => ({ ...prev, categoryId: defaultCategoryId })); } }}><i className="fas fa-plus"></i> Open Task</button></div>
            </div>
        </>
    );
};