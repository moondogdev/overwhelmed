import React from 'react';
import { Task, Settings } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { formatTime, formatTimestamp } from '../utils';
import { SimpleAccordion } from './SidebarComponents';
import { TaskAccordion, TaskAccordionHeader } from './TaskComponents';
import { TabbedView } from './TaskView';

interface CompletedTasksProps {
    filteredCompletedTasks: Task[];
    selectAllCompletedCheckboxRef: React.RefObject<HTMLInputElement>;
    allCompletedVisibleSelected: boolean;
    handleToggleSelectAllCompleted: () => void;
}

export const CompletedTasks: React.FC<CompletedTasksProps> = ({
    filteredCompletedTasks, selectAllCompletedCheckboxRef, allCompletedVisibleSelected,
    handleToggleSelectAllCompleted
}) => {
    const {
        settings, confirmingClearCompleted, handleClearCompleted, showToast, tasks, completedTasks,
        handleTaskUpdate, handleTimerNotify, selectedTaskIds, handleToggleTaskSelection,
        handleAccordionToggle, setSettings, handleReopenTask, handleDuplicateTask
    } = useAppContext();

    if (filteredCompletedTasks.length === 0) {
        return null;
    }

    const totalTrackedTime = filteredCompletedTasks.reduce((acc, task) => acc + (task.manualTime || 0), 0);
    const totalEarnings = filteredCompletedTasks.reduce((sum, task) => { const hours = (task.manualTime || 0) / (1000 * 60 * 60); return sum + (hours * (task.payRate || 0)); }, 0);
    const completedTitle = (() => { if (settings.activeCategoryId === 'all') return 'All Completed Tasks'; if (settings.activeSubCategoryId !== 'all') { return `${settings.categories.find(c => c.id === settings.activeSubCategoryId)?.name || 'Sub-Category'}: Completed List`; } const parentCategory = settings.categories.find(c => c.id === settings.activeCategoryId); return `${parentCategory?.name || 'Category'}: Completed List`; })();

    const handleCopyReport = () => {
        const reportHeader = "Completed Tasks Report\n======================\n";
        const reportBody = filteredCompletedTasks.map(task => {
            const closedAt = task.createdAt + (task.completedDuration ?? 0);
            return `- ${task.text}\n    - Date Opened: ${formatTimestamp(task.createdAt)}\n    - Closed at: ${formatTimestamp(closedAt)}\n    - Total Time: ${formatTime(task.completedDuration ?? 0)}`;
        }).join('\n\n');
        const fullReport = reportHeader + reportBody;
        navigator.clipboard.writeText(fullReport).then(() => { showToast('Report copied!'); }).catch(err => { console.error('Failed to copy report: ', err); });
    };

    return (
        <SimpleAccordion title={(<>{completedTitle} ({filteredCompletedTasks.length})<span className="accordion-title-summary">Total Time Tracked: {formatTime(totalTrackedTime)}</span><span className="accordion-title-summary">Total Earnings: ${totalEarnings.toFixed(2)}</span></>)}>
            <div className="completed-actions">
                <input
                    type="checkbox"
                    ref={selectAllCompletedCheckboxRef}
                    checked={allCompletedVisibleSelected}
                    onChange={handleToggleSelectAllCompleted}
                    title={allCompletedVisibleSelected ? "Deselect All Visible Completed" : "Select All Visible Completed"}
                />
                <button className={`icon-button ${confirmingClearCompleted ? 'confirm-delete' : ''}`} onClick={handleClearCompleted} title="Clear Completed List">{confirmingClearCompleted ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}</button>
                <button className="icon-button" onClick={handleCopyReport} title="Copy Report"><i className="fas fa-copy"></i></button>
            </div>
            <div className="priority-list-main">
                {filteredCompletedTasks.map((task) => {
                    const isSkipped = task.completionStatus === 'skipped';
                    return (
                        <div key={task.id} className={`priority-list-item completed-item ${isSkipped ? 'skipped-item' : ''}`} data-task-id={task.id}>
                            <TaskAccordion task={task} title={<TaskAccordionHeader task={task} settings={settings} onCategoryClick={() => { }} allTasks={[...tasks, ...completedTasks]} onUpdate={handleTaskUpdate} onNotify={(task) => handleTimerNotify(task, 'Timer notification')} isSelected={selectedTaskIds.includes(task.id)} onToggleSelection={handleToggleTaskSelection} />} isOpen={settings.openAccordionIds.includes(task.id)} onToggle={() => handleAccordionToggle(task.id)} settings={settings} completedTasks={completedTasks} onUpdate={handleTaskUpdate} onNotify={(task) => handleTimerNotify(task, 'Timer notification')} >
                                <TabbedView task={task} onUpdate={handleTaskUpdate} onSettingsChange={setSettings} />
                                <div className="list-item-controls"><button className="icon-button" onClick={() => handleReopenTask(task)} title="Reopen Task"><i className="fas fa-undo"></i></button><button className="icon-button" onClick={() => handleDuplicateTask(task)} title="Duplicate Task"><i className="fas fa-copy"></i></button></div>
                            </TaskAccordion>
                        </div>
                    );
                })}
            </div>
        </SimpleAccordion>
    );
};