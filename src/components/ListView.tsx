import React, { useMemo, useEffect, useRef } from 'react';
import { Task, Category, ChecklistSection, ChecklistItem } from '../types';
import { getContrastColor, getRelativeDateHeader, formatTimestamp, formatTime, } from '../utils';
import { TaskAccordion, TaskAccordionHeader, Stopwatch, Dropdown } from './TaskComponents';
import { TabbedView, CategoryOptions } from './TaskView';
import { useAppContext } from '../contexts/AppContext';
import { SimpleAccordion } from './SidebarComponents';
import './styles/ListView.css';

export function ListView() {
  const {
    tasks, completedTasks, setTasks, settings, setSettings, searchQuery, setSearchQuery, editingTaskId, setEditingTaskId,
    editingText, handleEditChange, handleEditKeyDown, editingViaContext, confirmingClearCompleted, handleClearAll,
    handleCopyList, handleClearCompleted, handleCompleteTask, moveTask, removeTask, handleTaskUpdate, handleAccordionToggle, setSelectedTaskIds,
    handleReopenTask, handleDuplicateTask, handleTogglePause, setActiveCategoryId, handleNextTask, handlePreviousTask,
    setActiveSubCategoryId, focusAddTaskInput, setNewTask, setFullTaskViewId, searchInputRef, sortSelectRef, selectedTaskIds, handleToggleTaskSelection,
    activeChecklistRef, showToast, setInboxMessages, handleChecklistCompletion, focusChecklistItemId,
    setFocusChecklistItemId, handleGlobalToggleTimer, handleGlobalStopTimer,
    activeTimerTaskId, activeTimerEntry, activeTimerLiveTime, handleTimerNotify
  } = useAppContext();

  const activeCategoryId = settings.activeCategoryId ?? 'all';
  const activeSubCategoryId = settings.activeSubCategoryId ?? 'all';

  const parentCategories = settings.categories.filter(c => !c.parentId);
  const subCategoriesForActive = activeCategoryId !== 'all' ? settings.categories.filter(c => c.parentId === activeCategoryId) : [];

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      if (activeCategoryId === 'all' && !searchQuery) return true;

      const matchesSearch = searchQuery ? task.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      if (!matchesSearch) return false;

      if (activeCategoryId === 'all') return true;

      const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
      const parentId = activeCategory?.parentId || activeCategoryId;
      const subCategoriesForParent = settings.categories.filter(c => c.parentId === parentId);

      if (activeSubCategoryId !== 'all') {
        return task.categoryId === activeSubCategoryId;
      }

      const categoryIdsToShow = [parentId, ...subCategoriesForParent.map(sc => sc.id)];
      return categoryIdsToShow.includes(task.categoryId);
    });

    const currentSortConfig = settings.prioritySortConfig?.[String(activeCategoryId)] || null;
    if (currentSortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (currentSortConfig.key === 'timeOpen') {
          aValue = a.createdAt;
          bValue = b.createdAt;
        } else if (currentSortConfig.key === 'priority') {
          const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
          aValue = priorityOrder[a.priority || 'Medium'];
          bValue = priorityOrder[b.priority || 'Medium'];
        } else {
          aValue = a[currentSortConfig.key as keyof Task] || 0;
          bValue = b[currentSortConfig.key as keyof Task] || 0;
        }

        if (aValue < bValue) return currentSortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return currentSortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [tasks, activeCategoryId, activeSubCategoryId, searchQuery, settings.categories, settings.prioritySortConfig]);

  const filteredCompletedTasks = useMemo(() => {
    return completedTasks.filter(task => {
      const matchesSearch = searchQuery ? task.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      if (!matchesSearch) return false;

      if (activeCategoryId === 'all') return true;

      const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
      const parentId = activeCategory?.parentId || activeCategoryId;
      const subCategoriesForParent = settings.categories.filter(c => c.parentId === parentId);

      if (activeSubCategoryId !== 'all') {
        return task.categoryId === activeSubCategoryId;
      }

      const categoryIdsToShow = [parentId, ...subCategoriesForParent.map(sc => sc.id)];
      return categoryIdsToShow.includes(task.categoryId);
    });
  }, [completedTasks, searchQuery, activeCategoryId, activeSubCategoryId, settings.categories]);

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const visibleTaskIds = useMemo(() => filteredTasks.map(task => task.id), [filteredTasks]);

  const allVisibleSelected = useMemo(() => 
    visibleTaskIds.length > 0 && visibleTaskIds.every(id => selectedTaskIds.includes(id)),
    [visibleTaskIds, selectedTaskIds]
  );

  const someVisibleSelected = useMemo(() => 
    visibleTaskIds.length > 0 && visibleTaskIds.some(id => selectedTaskIds.includes(id)),
    [visibleTaskIds, selectedTaskIds]
  );

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  const handleToggleSelectAll = () => {
    const visibleIdsSet = new Set(visibleTaskIds);
    setSelectedTaskIds(prev => allVisibleSelected ? prev.filter(id => !visibleIdsSet.has(id)) : [...new Set([...prev, ...visibleTaskIds])]);
  };

  // --- Logic for "Select All" in Completed Tasks (Moved to top level) ---
  const selectAllCompletedCheckboxRef = useRef<HTMLInputElement>(null);

  const visibleCompletedTaskIds = useMemo(() => filteredCompletedTasks.map(task => task.id), [filteredCompletedTasks]);

  const allCompletedVisibleSelected = useMemo(() =>
    visibleCompletedTaskIds.length > 0 && visibleCompletedTaskIds.every(id => selectedTaskIds.includes(id)),
    [visibleCompletedTaskIds, selectedTaskIds]
  );

  const someCompletedVisibleSelected = useMemo(() =>
    visibleCompletedTaskIds.length > 0 && visibleCompletedTaskIds.some(id => selectedTaskIds.includes(id)),
    [visibleCompletedTaskIds, selectedTaskIds]
  );

  useEffect(() => {
    if (selectAllCompletedCheckboxRef.current) {
      selectAllCompletedCheckboxRef.current.indeterminate = someCompletedVisibleSelected && !allCompletedVisibleSelected;
    }
  }, [someCompletedVisibleSelected, allCompletedVisibleSelected]);

  const handleToggleSelectAllCompleted = () => {
    const visibleIdsSet = new Set(visibleCompletedTaskIds);
    setSelectedTaskIds(prev => allCompletedVisibleSelected ? prev.filter(id => !visibleIdsSet.has(id)) : [...new Set([...prev, ...visibleIdsSet])]);
  };

  return (
    <div className="list-view-container">
      <div className="category-tabs">
        <button
          onClick={() => { setActiveCategoryId('all'); setActiveSubCategoryId('all'); setSearchQuery(''); }}
          className={`all-category-btn ${activeCategoryId === 'all' ? 'active' : ''}`}
          style={{
            backgroundColor: settings.allCategoryColor || '#4a4f5b',
            color: getContrastColor(settings.allCategoryColor || '#4a4f5b')
          }}
        >
          All ({tasks.length})
        </button>
        {parentCategories.map((cat: Category) => {
          const subCatIds = settings.categories.filter(sc => sc.parentId === cat.id).map(sc => sc.id);
          const count = tasks.filter(t => t.categoryId === cat.id || (t.categoryId && subCatIds.includes(t.categoryId))).length;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategoryId(cat.id); setActiveSubCategoryId('all'); setSearchQuery(''); }}
              className={activeCategoryId === cat.id ? 'active' : ''}
              style={{
                backgroundColor: cat.color || 'transparent',
                color: getContrastColor(cat.color || '#282c34')
              }}>
              {cat.name} ({count})
            </button>
          );
        })}
      </div>
      {subCategoriesForActive.length > 0 && (
        <div className="sub-category-tabs">
          {(() => {
            const parentCategory = settings.categories.find(c => c.id === activeCategoryId);
            const subCatIds = settings.categories.filter(sc => sc.parentId === parentCategory?.id).map(sc => sc.id);
            const totalCount = tasks.filter(t => t.categoryId === parentCategory?.id || (t.categoryId && subCatIds.includes(t.categoryId))).length;
            return (
              <button
                onClick={() => { setActiveSubCategoryId('all'); setSearchQuery(''); }}
                className={`all-category-btn ${activeSubCategoryId === 'all' ? 'active' : ''}`}
                style={{
                  backgroundColor: parentCategory?.color || '#3a3f4b',
                  color: getContrastColor(parentCategory?.color || '#3a3f4b')
                }}
              >All ({totalCount})</button>
            );
          })()}
          {subCategoriesForActive.map(subCat => {
            const count = tasks.filter(t => t.categoryId === subCat.id).length;
            return <button
              key={subCat.id}
              onClick={() => { setActiveSubCategoryId(subCat.id); setSearchQuery(''); }}
              className={activeSubCategoryId === subCat.id ? 'active' : ''}
              style={{
                backgroundColor: subCat.color || '#3a3f4b',
                color: getContrastColor(subCat.color || '#3a3f4b')
              }}
            >
              {subCat.name} ({count})
            </button>
          })}
        </div>
      )}
      <div className="list-view-controls">
        <div className="list-header-search" style={{ width: '100%' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
              }
            }}
          />
          <button className="clear-search-btn" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }} title="Clear Search"><i className="fas fa-times"></i></button>
        </div>
      </div>
      {filteredTasks.length > 0 ? (
        <>
          <div className="list-header">
            <h3>
              {(() => {
                if (activeCategoryId === 'all') return 'All Open Tasks';
                if (activeSubCategoryId !== 'all') {
                  return `${settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'Sub-Category'}: Priority List`;
                }
                const parentCategory = settings.categories.find(c => c.id === activeCategoryId);;
                return `${parentCategory?.name || 'Category'}: Priority List`;
              })()} ({filteredTasks.length})
            </h3>
            <div className="list-header-actions" onContextMenu={(e) => { e.stopPropagation(); }}>
              <button className="icon-button" onClick={handleClearAll} title="Clear All Tasks"><i className="fas fa-trash"></i></button>
              <input
                type="checkbox"
                ref={selectAllCheckboxRef}
                checked={allVisibleSelected}
                onChange={handleToggleSelectAll}
                title={allVisibleSelected ? "Deselect All Visible" : "Select All Visible"}
              />
              <button className="icon-button" onClick={handleCopyList} title="Copy Open Tasks"><i className="fas fa-copy"></i></button>
            </div>
            <div className="button-group">
              <button className="icon-button" onClick={() => { const allVisibleIds = filteredTasks.map(t => t.id);
                setSettings(prev => ({ ...prev, openAccordionIds: allVisibleIds }))
              }} title="Expand All"><i className="fas fa-folder-open"></i></button>
              <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, openAccordionIds: [] }))} title="Collapse All"><i className="fas fa-folder"></i></button>
            </div>
          </div>
          <div className="list-header-sort">
            <label>Sort by:
              <select ref={sortSelectRef} 
              onChange={(e) => {
                const value = e.target.value;
                const newSortConfig = { ...settings.prioritySortConfig };
                if (value === 'none') {
                  newSortConfig[String(activeCategoryId)] = null;
                } else {
                  const [key, direction] = value.split('-');
                  newSortConfig[String(activeCategoryId)] = { key: key as any, direction: direction as any };
                }
                setSettings(prev => ({ ...prev, prioritySortConfig: newSortConfig }));
              }} 
              value={settings.prioritySortConfig?.[String(activeCategoryId)] ? `${settings.prioritySortConfig[String(activeCategoryId)].key}-${settings.prioritySortConfig[String(activeCategoryId)].direction}` : 'none'}
              >
                <option value="none">Default (Manual)</option>
                <option value="completeBy-ascending">Due Date (Soonest First)</option>
                <option value="priority-ascending">Priority (High to Low)</option>
                <option value="openDate-descending">Open Date (Newest First)</option>
                <option value="openDate-ascending">Open Date (Oldest First)</option>
              </select>
            </label>
            {settings.prioritySortConfig?.[String(activeCategoryId)] && (
              <button className="clear-sort-btn" onClick={() => { setSettings(prev => ({ ...prev, prioritySortConfig: { ...prev.prioritySortConfig, [String(activeCategoryId)]: null } })); if (sortSelectRef.current) sortSelectRef.current.value = 'none'; }} title="Clear Sort"><i className="fas fa-times"></i></button>
            )}
          </div>
          <div className="priority-list-main">
            {settings.prioritySortConfig?.[String(activeCategoryId)]?.key === 'completeBy' && settings.prioritySortConfig?.[String(activeCategoryId)]?.direction === 'ascending' ? (
              (() => {
                const tasksByDate = filteredTasks.reduce((acc, task) => {
                  // This is the corrected logic. It creates a date string based on the local timezone,
                  // not UTC, which prevents tasks from being incorrectly grouped into the next or previous day.
                  let date = '0000-no-due-date';
                  if (task.completeBy) {
                    const d = new Date(task.completeBy);
                    // Format to YYYY-MM-DD in local time
                    date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  }
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
                      <h4 className={`date-group-header ${isNoDueDate ? 'no-due-date-header' : ''}`}>
                        {headerText} 
                        <span className="date-group-task-count">{taskCountText}</span>
                      </h4>
                      {tasksOnDate.map((task, index) => (
                        <div key={task.id} className="priority-list-item" data-task-id={task.id}>
                          {editingTaskId === task.id ? (
                            <input type="text" value={editingText} onChange={handleEditChange} onKeyDown={(e) => handleEditKeyDown(e, task.id)} onBlur={() => setEditingTaskId(null)} autoFocus/>
                          ) : (                            
                            <TaskAccordion task={task} isOpen={settings.openAccordionIds.includes(task.id)} onToggle={() => handleAccordionToggle(task.id)} settings={settings} completedTasks={completedTasks} title={<TaskAccordionHeader task={task} settings={settings} onCategoryClick={(e, catId, parentId) => { e.stopPropagation(); setActiveCategoryId(parentId || catId); if (parentId) { setActiveSubCategoryId(catId); } else { setActiveSubCategoryId('all'); } }} allTasks={[...tasks, ...completedTasks]} onUpdate={handleTaskUpdate} onNotify={handleTimerNotify} isSelected={selectedTaskIds.includes(task.id)} onToggleSelection={handleToggleTaskSelection} />}>
                              <><TabbedView 
                                  task={task} 
                                  onUpdate={handleTaskUpdate}
                                  onSettingsChange={setSettings} 
                                /><div className="task-item-display"><span className="stopwatch date-opened">Started at: {formatTimestamp(task.createdAt)}</span><Stopwatch task={task} onTogglePause={handleTogglePause} /></div></>
                              <div className="list-item-controls">
                                <button onClick={() => { const newAutocompleteState = !task.isAutocomplete; setTasks(tasks.map(t => t.id === task.id ? { ...t, isAutocomplete: newAutocompleteState } : t)); showToast(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`); }} title="Toggle Autocomplete" className={`icon-button recurring-toggle ${task.isAutocomplete ? 'active' : ''}`}><i className="fas fa-robot"></i></button>
                                <Dropdown trigger={<button title="Recurring Options" className={`icon-button recurring-toggle ${task.isRecurring || task.isDailyRecurring || task.isWeeklyRecurring || task.isMonthlyRecurring || task.isYearlyRecurring ? 'active' : ''}`}><i className="fas fa-sync-alt"></i></button>}><button onClick={() => handleTaskUpdate({ ...task, isRecurring: !task.isRecurring })} className={task.isRecurring ? 'active' : ''}>Re-occur on Complete</button><button onClick={() => handleTaskUpdate({ ...task, isDailyRecurring: !task.isDailyRecurring })} className={task.isDailyRecurring ? 'active' : ''}>Repeat Daily</button><button onClick={() => handleTaskUpdate({ ...task, isWeeklyRecurring: !task.isWeeklyRecurring })} className={task.isWeeklyRecurring ? 'active' : ''}>Repeat Weekly</button><button onClick={() => handleTaskUpdate({ ...task, isMonthlyRecurring: !task.isMonthlyRecurring })} className={task.isMonthlyRecurring ? 'active' : ''}>Repeat Monthly</button><button onClick={() => handleTaskUpdate({ ...task, isYearlyRecurring: !task.isYearlyRecurring })} className={task.isYearlyRecurring ? 'active' : ''}>Repeat Yearly</button></Dropdown>
                                <button className="icon-button" title="View Full Page" onClick={(e) => { e.stopPropagation(); setFullTaskViewId(task.id); }}><i className="fas fa-expand-arrows-alt"></i></button>                                
                                <button onClick={() => handleCompleteTask(task, 'skipped')} className="icon-button skip-btn" title="Skip Task"><i className="fas fa-forward"></i></button>
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
                {editingTaskId === task.id ? (
                  <input type="text" value={editingText} onChange={handleEditChange} onKeyDown={(e) => handleEditKeyDown(e, task.id)} onBlur={() => setEditingTaskId(null)} autoFocus/>
                ) : (
                  <TaskAccordion task={task} isOpen={settings.openAccordionIds.includes(task.id)} onToggle={() => handleAccordionToggle(task.id)} settings={settings} completedTasks={completedTasks} title={<TaskAccordionHeader task={task} settings={settings} onCategoryClick={(e, catId, parentId) => { e.stopPropagation(); setActiveCategoryId(parentId || catId); if (parentId) { setActiveSubCategoryId(catId); } else { setActiveSubCategoryId('all'); } }} allTasks={[...tasks, ...completedTasks]} onUpdate={handleTaskUpdate} onNotify={handleTimerNotify} isSelected={selectedTaskIds.includes(task.id)} onToggleSelection={handleToggleTaskSelection} />}>
                    <><TabbedView 
                        task={task} 
                        onUpdate={handleTaskUpdate} 
                        onSettingsChange={setSettings} 
                      /><div className="task-item-display"><span className="stopwatch date-opened">Started at: {formatTimestamp(task.createdAt)}</span><Stopwatch task={task} onTogglePause={handleTogglePause} /></div></>
                    <div className="list-item-controls">
                      <button onClick={() => { const newAutocompleteState = !task.isAutocomplete; setTasks(tasks.map(t => t.id === task.id ? { ...t, isAutocomplete: newAutocompleteState } : t)); showToast(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`); }} title="Toggle Autocomplete" className={`icon-button recurring-toggle ${task.isAutocomplete ? 'active' : ''}`}><i className="fas fa-robot"></i></button>
                      <Dropdown trigger={<button title="Recurring Options" className={`icon-button recurring-toggle ${task.isRecurring || task.isDailyRecurring || task.isWeeklyRecurring || task.isMonthlyRecurring || task.isYearlyRecurring ? 'active' : ''}`}><i className="fas fa-sync-alt"></i></button>}><button onClick={() => handleTaskUpdate({ ...task, isRecurring: !task.isRecurring })} className={task.isRecurring ? 'active' : ''}>Re-occur on Complete</button><button onClick={() => handleTaskUpdate({ ...task, isDailyRecurring: !task.isDailyRecurring })} className={task.isDailyRecurring ? 'active' : ''}>Repeat Daily</button><button onClick={() => handleTaskUpdate({ ...task, isWeeklyRecurring: !task.isWeeklyRecurring })} className={task.isWeeklyRecurring ? 'active' : ''}>Repeat Weekly</button><button onClick={() => handleTaskUpdate({ ...task, isMonthlyRecurring: !task.isMonthlyRecurring })} className={task.isMonthlyRecurring ? 'active' : ''}>Repeat Monthly</button><button onClick={() => handleTaskUpdate({ ...task, isYearlyRecurring: !task.isYearlyRecurring })} className={task.isYearlyRecurring ? 'active' : ''}>Repeat Yearly</button></Dropdown>                      
                      <button className="icon-button" title="View Full Page" onClick={(e) => { e.stopPropagation(); setFullTaskViewId(task.id); }}><i className="fas fa-expand-arrows-alt"></i></button>
                      <button onClick={() => handleCompleteTask(task, 'skipped')} className="icon-button skip-btn" title="Skip Task"><i className="fas fa-forward"></i></button>
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
      ) : (
        <div className="empty-list-placeholder">
          <h3>No Open Tasks for {(() => { if (activeCategoryId === 'all') return 'any category'; if (activeSubCategoryId !== 'all') { return settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'this category'; } const parentCategory = settings.categories.find(c => c.id === activeCategoryId); return parentCategory?.name || 'this category'; })()}</h3>
          <button onClick={() => { focusAddTaskInput(); const defaultCategoryId = activeSubCategoryId !== 'all' ? activeSubCategoryId : (activeCategoryId !== 'all' ? activeCategoryId : undefined); if (defaultCategoryId) { ; setNewTask(prev => ({ ...prev, categoryId: defaultCategoryId })); } }}><i className="fas fa-plus"></i> Open Task</button>
        </div>
      )}
      {filteredCompletedTasks.length > 0 && (() => {
        const totalTrackedTime = filteredCompletedTasks.reduce((acc, task) => acc + (task.manualTime || 0), 0);
        const totalEarnings = filteredCompletedTasks.reduce((sum, task) => { const hours = (task.manualTime || 0) / (1000 * 60 * 60); return sum + (hours * (task.payRate || 0)); }, 0);
        const completedTitle = (() => { if (activeCategoryId === 'all') return 'All Completed Tasks'; if (activeSubCategoryId !== 'all') { return `${settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'Sub-Category'}: Completed List`; } const parentCategory = settings.categories.find(c => c.id === activeCategoryId); return `${parentCategory?.name || 'Category'}: Completed List`; })();
        
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
              <button className={`icon-button ${confirmingClearCompleted ? 'confirm-delete' : ''}`} onClick={handleClearCompleted} title="Clear Completed List">{confirmingClearCompleted ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}</button><button className="icon-button" onClick={handleCopyReport} title="Copy Report"><i className="fas fa-copy"></i></button></div>
            <div className="priority-list-main">
              {filteredCompletedTasks.map((task) => {
                const isSkipped = task.completionStatus === 'skipped';
                const title = (
                  <>
                    <div className={`accordion-main-title ${isSkipped ? 'skipped-task' : ''}`}>{isSkipped && <i className="fas fa-forward skipped-icon" title="Skipped"></i>}{task.text}
                    </div>
                    <div className="accordion-subtitle">{task.company && <span>{task.company}</span>}<span>{formatTimestamp(task.openDate)}</span><span>{isSkipped ? 'Skipped after:' : 'Completed in:'} {formatTime(task.completedDuration ?? 0)}</span></div>
                  </>);
                return (
                  <div key={task.id} className={`priority-list-item completed-item ${isSkipped ? 'skipped-item' : ''}`} data-task-id={task.id}>
                    <TaskAccordion task={task} title={<TaskAccordionHeader task={task} settings={settings} onCategoryClick={() => {}} allTasks={[...tasks, ...completedTasks]} onUpdate={handleTaskUpdate} onNotify={handleTimerNotify} isSelected={selectedTaskIds.includes(task.id)} onToggleSelection={handleToggleTaskSelection} />} isOpen={settings.openAccordionIds.includes(task.id)} onToggle={() => handleAccordionToggle(task.id)} settings={settings} completedTasks={completedTasks} onUpdate={handleTaskUpdate} onNotify={handleTimerNotify}>
                      <TabbedView task={task} onUpdate={handleTaskUpdate} onSettingsChange={setSettings} />
                      <div className="list-item-controls"><button className="icon-button" onClick={() => handleReopenTask(task)} title="Reopen Task"><i className="fas fa-undo"></i></button><button className="icon-button" onClick={() => handleDuplicateTask(task)} title="Duplicate Task"><i className="fas fa-copy"></i></button></div>
                    </TaskAccordion>
                  </div>
                );
              })}
            </div>
          </SimpleAccordion>
        );
      })()}
    </div>
  );
}