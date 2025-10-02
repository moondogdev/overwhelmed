import React from 'react';
import { Word, Category } from '../types';
import { getContrastColor, getRelativeDateHeader, formatTimestamp, formatTime, } from '../utils';
import { TaskAccordion, TaskAccordionHeader, Stopwatch, Dropdown } from './TaskComponents';
import { TabbedView, CategoryOptions } from './TaskView';
import { useAppContext } from '../contexts/AppContext';
import { SimpleAccordion } from './SidebarComponents';
import './styles/ListView.css';

export function ListView() {
  const {
    words, completedWords, setWords, settings, setSettings, searchQuery, setSearchQuery, editingWordId, setEditingWordId,
    editingText, handleEditChange, handleEditKeyDown, editingViaContext, confirmingClearCompleted, handleClearAll,
    handleCopyList, handleClearCompleted, handleCompleteWord, moveWord, removeWord, handleWordUpdate,
    handleAccordionToggle, handleReopenTask, handleDuplicateTask, handleTogglePause, setActiveCategoryId, handleNextTask, handlePreviousTask,
    setActiveSubCategoryId, focusAddTaskInput, setNewTask, setFullTaskViewId, searchInputRef, sortSelectRef,
    activeChecklistRef, showToast, setInboxMessages, handleChecklistCompletion, focusChecklistItemId,
    setFocusChecklistItemId, handleGlobalToggleTimer, handleGlobalStopTimer,
    activeTimerWordId, activeTimerEntry, activeTimerLiveTime, handleTimerNotify
  } = useAppContext();

  const activeCategoryId = settings.activeCategoryId ?? 'all';
  const activeSubCategoryId = settings.activeSubCategoryId ?? 'all';

  const parentCategories = settings.categories.filter(c => !c.parentId);
  const subCategoriesForActive = activeCategoryId !== 'all' ? settings.categories.filter(c => c.parentId === activeCategoryId) : [];

  const filteredWords = words.filter(word => {
    if (activeCategoryId === 'all' && !searchQuery) return true;

    const matchesSearch = searchQuery ? word.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    if (!matchesSearch) return false;

    if (activeCategoryId === 'all') return true;

    const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
    const parentId = activeCategory?.parentId || activeCategoryId;
    const subCategoriesForParent = settings.categories.filter(c => c.parentId === parentId);

    if (activeSubCategoryId !== 'all') {
      return word.categoryId === activeSubCategoryId;
    }

    const categoryIdsToShow = [parentId, ...subCategoriesForParent.map(sc => sc.id)];
    return categoryIdsToShow.includes(word.categoryId);
  });

  const currentSortConfig = settings.prioritySortConfig?.[String(activeCategoryId)] || null;
  if (currentSortConfig) {
    filteredWords.sort((a, b) => {
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
        aValue = a[currentSortConfig.key as keyof Word] || 0;
        bValue = b[currentSortConfig.key as keyof Word] || 0;
      }

      if (aValue < bValue) return currentSortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return currentSortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }

  const filteredCompletedWords = completedWords.filter(word => {
    const matchesSearch = searchQuery ? word.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    if (!matchesSearch) return false;

    if (activeCategoryId === 'all') return true;

    const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
    const parentId = activeCategory?.parentId || activeCategoryId;
    const subCategoriesForParent = settings.categories.filter(c => c.parentId === parentId);

    if (activeSubCategoryId !== 'all') {
      return word.categoryId === activeSubCategoryId;
    }

    const categoryIdsToShow = [parentId, ...subCategoriesForParent.map(sc => sc.id)];
    return categoryIdsToShow.includes(word.categoryId);
  });

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
          All ({words.length})
        </button>
        {parentCategories.map((cat: Category) => {
          const subCatIds = settings.categories.filter(sc => sc.parentId === cat.id).map(sc => sc.id);
          const count = words.filter(w => w.categoryId === cat.id || (w.categoryId && subCatIds.includes(w.categoryId))).length;
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
            const totalCount = words.filter(w => w.categoryId === parentCategory?.id || (w.categoryId && subCatIds.includes(w.categoryId))).length;
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
            const count = words.filter(w => w.categoryId === subCat.id).length;
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
      {filteredWords.length > 0 ? (
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
              })()} ({filteredWords.length})
            </h3>
            <div className="list-header-actions" onContextMenu={(e) => { e.stopPropagation(); }}>
              <button className="icon-button" onClick={handleClearAll} title="Clear All Tasks"><i className="fas fa-trash"></i></button>
              <button className="icon-button" onClick={handleCopyList} title="Copy Open Tasks"><i className="fas fa-copy"></i></button>
            </div>
            <div className="button-group">
              <button className="icon-button" onClick={() => {
                const allVisibleIds = filteredWords.map(w => w.id);
                setSettings(prev => ({ ...prev, openAccordionIds: allVisibleIds }))
              }} title="Expand All"><i className="fas fa-folder-open"></i></button>
              <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, openAccordionIds: [] }))} title="Collapse All"><i className="fas fa-folder"></i></button>
            </div>
          </div>
          <div className="list-header-sort">
            <label>Sort by:
              <select ref={sortSelectRef} onChange={(e) => {
                const value = e.target.value;
                const newSortConfig = { ...settings.prioritySortConfig };
                if (value === 'none') {
                  newSortConfig[String(activeCategoryId)] = null;
                } else {
                  const [key, direction] = value.split('-');
                  newSortConfig[String(activeCategoryId)] = { key: key as any, direction: direction as any };
                }
                setSettings(prev => ({ ...prev, prioritySortConfig: newSortConfig }));
              }} value={currentSortConfig ? `${currentSortConfig.key}-${currentSortConfig.direction}` : 'none'}>
                <option value="none">Default (Manual)</option>
                <option value="completeBy-ascending">Due Date (Soonest First)</option>
                <option value="priority-ascending">Priority (High to Low)</option>
                <option value="openDate-descending">Open Date (Newest First)</option>
                <option value="openDate-ascending">Open Date (Oldest First)</option>
              </select>
            </label>
            {currentSortConfig && (
              <button className="clear-sort-btn" onClick={() => { setSettings(prev => ({ ...prev, prioritySortConfig: { ...prev.prioritySortConfig, [String(activeCategoryId)]: null } })); if (sortSelectRef.current) sortSelectRef.current.value = 'none'; }} title="Clear Sort"><i className="fas fa-times"></i></button>
            )}
          </div>
          <div className="priority-list-main">
            {currentSortConfig?.key === 'completeBy' && currentSortConfig.direction === 'ascending' ? (
              (() => {
                const wordsByDate = filteredWords.reduce((acc, word) => {
                  const date = word.completeBy ? new Date(word.completeBy).toISOString().split('T')[0] : '0000-no-due-date';
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(word);
                  return acc;
                }, {} as Record<string, Word[]>);

                const sortedDates = Object.keys(wordsByDate).sort();

                return sortedDates.map(dateStr => {
                  const wordsOnDate = wordsByDate[dateStr];
                  const isNoDueDate = dateStr === '0000-no-due-date';
                  let headerText = isNoDueDate ? 'No Due Date' : getRelativeDateHeader(dateStr);
                  const taskCountText = `(${wordsOnDate.length} ${wordsOnDate.length === 1 ? 'task' : 'tasks'})`;
                  return (
                    <div key={dateStr} className="date-group-container">
                      <h4 className={`date-group-header ${isNoDueDate ? 'no-due-date-header' : ''}`}>
                        {headerText} 
                        <span className="date-group-task-count">{taskCountText}</span>
                      </h4>
                      {wordsOnDate.map((word, index) => (
                        <div key={word.id} className="priority-list-item" data-word-id={word.id}>
                          {editingWordId === word.id ? (
                            <input type="text" value={editingText} onChange={handleEditChange} onKeyDown={(e) => handleEditKeyDown(e, word.id)} onBlur={() => setEditingWordId(null)} autoFocus/>
                          ) : (                            
                            <TaskAccordion word={word} isOpen={settings.openAccordionIds.includes(word.id)} onToggle={() => handleAccordionToggle(word.id)} settings={settings} completedWords={completedWords} title={<TaskAccordionHeader word={word} settings={settings} onCategoryClick={(e, catId, parentId) => { e.stopPropagation(); setActiveCategoryId(parentId || catId); if (parentId) { setActiveSubCategoryId(catId); } else { setActiveSubCategoryId('all'); } }} allWords={[...words, ...completedWords]} onUpdate={handleWordUpdate} onNotify={handleTimerNotify} />}>
                              <><TabbedView 
                                  word={word} 
                                  onUpdate={handleWordUpdate} 
                                  // FIX: Pass the setSettings function from the context directly.
                                  // This ensures the prop chain is consistent.
                                  onSettingsChange={setSettings} 
                                /><div className="word-item-display"><span className="stopwatch date-opened">Started at: {formatTimestamp(word.createdAt)}</span><Stopwatch word={word} onTogglePause={handleTogglePause} /></div></>
                              <div className="list-item-controls"><button onClick={() => { const newAutocompleteState = !word.isAutocomplete; setWords(words.map(w => w.id === word.id ? { ...w, isAutocomplete: newAutocompleteState } : w)); showToast(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`); }} title="Toggle Autocomplete" className={`icon-button recurring-toggle ${word.isAutocomplete ? 'active' : ''}`}><i className="fas fa-robot"></i></button><Dropdown trigger={<button title="Recurring Options" className={`icon-button recurring-toggle ${word.isRecurring || word.isDailyRecurring || word.isWeeklyRecurring || word.isMonthlyRecurring || word.isYearlyRecurring ? 'active' : ''}`}><i className="fas fa-sync-alt"></i></button>}><button onClick={() => handleWordUpdate({ ...word, isRecurring: !word.isRecurring })} className={word.isRecurring ? 'active' : ''}>Re-occur on Complete</button><button onClick={() => handleWordUpdate({ ...word, isDailyRecurring: !word.isDailyRecurring })} className={word.isDailyRecurring ? 'active' : ''}>Repeat Daily</button><button onClick={() => handleWordUpdate({ ...word, isWeeklyRecurring: !word.isWeeklyRecurring })} className={word.isWeeklyRecurring ? 'active' : ''}>Repeat Weekly</button><button onClick={() => handleWordUpdate({ ...word, isMonthlyRecurring: !word.isMonthlyRecurring })} className={word.isMonthlyRecurring ? 'active' : ''}>Repeat Monthly</button><button onClick={() => handleWordUpdate({ ...word, isYearlyRecurring: !word.isYearlyRecurring })} className={word.isYearlyRecurring ? 'active' : ''}>Repeat Yearly</button></Dropdown><button className="icon-button" title="View Full Page" onClick={(e) => { e.stopPropagation(); setFullTaskViewId(word.id); }}><i className="fas fa-expand-arrows-alt"></i></button><button onClick={() => handleCompleteWord(word)} className="icon-button complete-btn" title="Complete Task"><i className="fas fa-check"></i></button>{currentSortConfig === null && (<><button className="icon-button" onClick={() => { const targetWord = filteredWords[index - 1]; if (targetWord) moveWord(word.id, targetWord.id); }} disabled={index === 0} title="Move Up"><i className="fas fa-arrow-up"></i></button><button className="icon-button" onClick={() => { const targetWord = filteredWords[index + 1]; if (targetWord) moveWord(word.id, targetWord.id); }} disabled={index === filteredWords.length - 1} title="Move Down"><i className="fas fa-arrow-down"></i></button></>)}<button onClick={() => removeWord(word.id)} className="icon-button remove-btn" title="Delete Task"><i className="fas fa-trash"></i></button></div>
                            </TaskAccordion>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                });
              })()
            ) : (filteredWords.map((word, index) => (
              <div key={word.id} className="priority-list-item" data-word-id={word.id}>
                {editingWordId === word.id ? (
                  <input type="text" value={editingText} onChange={handleEditChange} onKeyDown={(e) => handleEditKeyDown(e, word.id)} onBlur={() => setEditingWordId(null)} autoFocus/>
                ) : (
                  <TaskAccordion word={word} isOpen={settings.openAccordionIds.includes(word.id)} onToggle={() => handleAccordionToggle(word.id)} settings={settings} completedWords={completedWords} title={<TaskAccordionHeader word={word} settings={settings} onCategoryClick={(e, catId, parentId) => { e.stopPropagation(); setActiveCategoryId(parentId || catId); if (parentId) { setActiveSubCategoryId(catId); } else { setActiveSubCategoryId('all'); } }} allWords={[...words, ...completedWords]} onUpdate={handleWordUpdate} onNotify={handleTimerNotify} />}>
                    <><TabbedView 
                        word={word} 
                        onUpdate={handleWordUpdate} 
                        // FIX: Pass the setSettings function from the context directly.
                        // This ensures the prop chain is consistent.
                        onSettingsChange={setSettings} 
                      /><div className="word-item-display"><span className="stopwatch date-opened">Started at: {formatTimestamp(word.createdAt)}</span><Stopwatch word={word} onTogglePause={handleTogglePause} /></div></>
                    <div className="list-item-controls"><button onClick={() => { const newAutocompleteState = !word.isAutocomplete; setWords(words.map(w => w.id === word.id ? { ...w, isAutocomplete: newAutocompleteState } : w)); showToast(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`); }} title="Toggle Autocomplete" className={`icon-button recurring-toggle ${word.isAutocomplete ? 'active' : ''}`}><i className="fas fa-robot"></i></button><Dropdown trigger={<button title="Recurring Options" className={`icon-button recurring-toggle ${word.isRecurring || word.isDailyRecurring || word.isWeeklyRecurring || word.isMonthlyRecurring || word.isYearlyRecurring ? 'active' : ''}`}><i className="fas fa-sync-alt"></i></button>}><button onClick={() => handleWordUpdate({ ...word, isRecurring: !word.isRecurring })} className={word.isRecurring ? 'active' : ''}>Re-occur on Complete</button><button onClick={() => handleWordUpdate({ ...word, isDailyRecurring: !word.isDailyRecurring })} className={word.isDailyRecurring ? 'active' : ''}>Repeat Daily</button><button onClick={() => handleWordUpdate({ ...word, isWeeklyRecurring: !word.isWeeklyRecurring })} className={word.isWeeklyRecurring ? 'active' : ''}>Repeat Weekly</button><button onClick={() => handleWordUpdate({ ...word, isMonthlyRecurring: !word.isMonthlyRecurring })} className={word.isMonthlyRecurring ? 'active' : ''}>Repeat Monthly</button><button onClick={() => handleWordUpdate({ ...word, isYearlyRecurring: !word.isYearlyRecurring })} className={word.isYearlyRecurring ? 'active' : ''}>Repeat Yearly</button></Dropdown><button className="icon-button" title="View Full Page" onClick={(e) => { e.stopPropagation(); setFullTaskViewId(word.id); }}><i className="fas fa-expand-arrows-alt"></i></button><button onClick={() => handleCompleteWord(word)} className="icon-button complete-btn" title="Complete Task"><i className="fas fa-check"></i></button>{currentSortConfig === null && (<><button className="icon-button" onClick={() => { const targetWord = filteredWords[index - 1]; if (targetWord) moveWord(word.id, targetWord.id); }} disabled={index === 0} title="Move Up"><i className="fas fa-arrow-up"></i></button><button className="icon-button" onClick={() => { const targetWord = filteredWords[index + 1]; if (targetWord) moveWord(word.id, targetWord.id); }} disabled={index === filteredWords.length - 1} title="Move Down"><i className="fas fa-arrow-down"></i></button></>)}<button onClick={() => removeWord(word.id)} className="icon-button remove-btn" title="Delete Task"><i className="fas fa-trash"></i></button></div>
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
      {filteredCompletedWords.length > 0 && (() => {
        const totalTrackedTime = filteredCompletedWords.reduce((acc, word) => acc + (word.manualTime || 0), 0);
        const totalEarnings = filteredCompletedWords.reduce((sum, word) => { const hours = (word.manualTime || 0) / (1000 * 60 * 60); return sum + (hours * (word.payRate || 0)); }, 0);
        const completedTitle = (() => { if (activeCategoryId === 'all') return 'All Completed Tasks'; if (activeSubCategoryId !== 'all') { return `${settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'Sub-Category'}: Completed List`; } const parentCategory = settings.categories.find(c => c.id === activeCategoryId); return `${parentCategory?.name || 'Category'}: Completed List`; })();
        
        const handleCopyReport = () => {
          const reportHeader = "Completed Tasks Report\n======================\n";
          const reportBody = filteredCompletedWords.map(word => {
            const closedAt = word.createdAt + (word.completedDuration ?? 0);
            return `- ${word.text}\n    - Date Opened: ${formatTimestamp(word.createdAt)}\n    - Closed at: ${formatTimestamp(closedAt)}\n    - Total Time: ${formatTime(word.completedDuration ?? 0)}`;
          }).join('\n\n');
          const fullReport = reportHeader + reportBody;
          navigator.clipboard.writeText(fullReport).then(() => { showToast('Report copied!'); }).catch(err => { console.error('Failed to copy report: ', err); });
        };

        return (
          <SimpleAccordion title={(<>{completedTitle} ({filteredCompletedWords.length})<span className="accordion-title-summary">Total Time Tracked: {formatTime(totalTrackedTime)}</span><span className="accordion-title-summary">Total Earnings: ${totalEarnings.toFixed(2)}</span></>)}>
            <div className="completed-actions"><button className={`icon-button ${confirmingClearCompleted ? 'confirm-delete' : ''}`} onClick={handleClearCompleted} title="Clear Completed List">{confirmingClearCompleted ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}</button><button className="icon-button" onClick={handleCopyReport} title="Copy Report"><i className="fas fa-copy"></i></button></div>
            <div className="priority-list-main">
              {filteredCompletedWords.map((word) => {
                const title = (<><div className="accordion-main-title">{word.text}</div><div className="accordion-subtitle">{word.company && <span>{word.company}</span>}<span>{formatTimestamp(word.openDate)}</span><span>Completed in: {formatTime(word.completedDuration ?? 0)}</span></div></>);
                return (
                  <div key={word.id} className="priority-list-item completed-item" data-word-id={word.id}>                    
                    <TaskAccordionHeader word={word} settings={settings} allWords={[...words, ...completedWords]} onCategoryClick={() => { }} onUpdate={handleWordUpdate} onNotify={handleTimerNotify} />
                    <TaskAccordion word={word} title={title} isOpen={settings.openAccordionIds.includes(word.id)} onToggle={() => handleAccordionToggle(word.id)} settings={settings} completedWords={completedWords} onUpdate={handleWordUpdate} onNotify={handleTimerNotify}>                    
                      <TabbedView 
                        word={word} 
                        onUpdate={handleWordUpdate} 
                        onSettingsChange={setSettings}
                      />
                      <div className="list-item-controls"><button className="icon-button" onClick={() => handleReopenTask(word)} title="Reopen Task"><i className="fas fa-undo"></i></button><button className="icon-button" onClick={() => handleDuplicateTask(word)} title="Duplicate Task"><i className="fas fa-copy"></i></button></div>
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