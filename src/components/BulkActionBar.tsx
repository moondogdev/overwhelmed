import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import './styles/BulkActionBar.css';
import { Dropdown } from './TaskComponents';

export function BulkActionBar() {
  const { 
    selectedTaskIds, setSelectedTaskIds, handleBulkDelete, handleBulkSetCategory, 
    handleBulkSetDueDate, handleBulkSetPriority, handleBulkComplete, handleBulkReopen, handleBulkCopyAsCsv, handleBulkDownloadAsCsv, handleBulkSetAccount,
    settings, tasks, completedTasks 
  } = useAppContext();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset confirmation state if selection changes
  useEffect(() => {
    setIsConfirmingDelete(false);
    setIsDatePickerVisible(false); // Also hide date picker on selection change
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
    }
  }, [selectedTaskIds]);

  const handleDeselectAll = () => {
    setSelectedTaskIds([]);
  };

  const handleCategoryChange = (categoryId: number) => {
    handleBulkSetCategory(selectedTaskIds, categoryId);
    // Clear selection after action
    setSelectedTaskIds([]);
  };

  const handleAccountChange = (accountId: number) => {
    handleBulkSetAccount(selectedTaskIds, accountId);
    setSelectedTaskIds([]);
  };

  const handlePriorityChange = (priority: 'High' | 'Medium' | 'Low') => {
    handleBulkSetPriority(selectedTaskIds, priority);
    // Clear selection after action
    setSelectedTaskIds([]);
  };

  const handleCompleteClick = () => {
    // This action is non-destructive, so no confirmation is needed.
    handleBulkComplete(selectedTaskIds);
    setSelectedTaskIds([]); // Clear selection after action
  };

  const handleReopenClick = () => {
    handleBulkReopen(selectedTaskIds);
    setSelectedTaskIds([]);
  };

  const selectionType = useMemo(() => {
    if (selectedTaskIds.length === 0) return 'none';
    const allActive = selectedTaskIds.every(id => tasks.some(t => t.id === id));
    if (allActive) return 'active';
    const allCompleted = selectedTaskIds.every(id => completedTasks.some(t => t.id === id));
    if (allCompleted) return 'completed';
    return 'mixed';
  }, [selectedTaskIds, tasks, completedTasks]);

  const isTransactionsView = useMemo(() => {
    const parentCategory = settings.categories.find(c => c.name === 'Transactions');
    if (!parentCategory) return false;
    if (settings.activeCategoryId === parentCategory.id) return true;
    const activeCat = settings.categories.find(c => c.id === settings.activeCategoryId);
    return activeCat?.parentId === parentCategory.id;
  }, [settings.activeCategoryId, settings.categories]);

  if (selectedTaskIds.length === 0) {
    return null;
  }

  const handleConfirmDueDate = () => {
    if (dueDate) {
      const timestamp = new Date(dueDate).getTime();
      handleBulkSetDueDate(selectedTaskIds, timestamp);
      setSelectedTaskIds([]); // Clear selection
      setIsDatePickerVisible(false); // Hide picker
      setDueDate(''); // Reset date
    }
  };

  const handleDeleteClick = () => {
    if (isConfirmingDelete) {
      handleBulkDelete(selectedTaskIds);
      setSelectedTaskIds([]); // Clear selection after deleting
    } else {
      setIsConfirmingDelete(true);
      confirmTimeoutRef.current = setTimeout(() => setIsConfirmingDelete(false), 3000);
    }
  };

  return (
    <div className="bulk-action-bar">
      <div className="bulk-action-info">
        <span>{selectedTaskIds.length} task(s) selected</span>
        <button onClick={handleDeselectAll} className="deselect-all-btn">
          <i className="fas fa-times"></i> Deselect All
        </button>
      </div>
      <div className="bulk-action-buttons">
        <Dropdown trigger={
          <button className="icon-button" title="Change Category">
            <i className="fas fa-folder-open"></i>
          </button>
        }>
          {settings.categories.filter(c => !c.parentId).map(parentCat => {
            const children = settings.categories.filter(sub => sub.parentId === parentCat.id);
            return (
              <React.Fragment key={parentCat.id}>
                <button className="category-dropdown-item parent" onClick={() => handleCategoryChange(parentCat.id)}>{parentCat.name}</button>
                {children.map(child => (
                  <button key={child.id} className="category-dropdown-item sub" onClick={() => handleCategoryChange(child.id)}>{child.name}</button>
                ))}
              </React.Fragment>
            )
          })}
        </Dropdown>
        {isTransactionsView && (
          <Dropdown trigger={
            <button className="icon-button" title="Change Account">
              <i className="fas fa-university"></i>
            </button>
          }>
            <button className="category-dropdown-item parent" onClick={() => handleAccountChange(0)}>-- None --</button>
            {settings.accounts.map(account => (
              <button key={account.id} className="category-dropdown-item" onClick={() => handleAccountChange(account.id)}>{account.name}</button>
            ))}
          </Dropdown>
        )}
        <div className="bulk-action-group">
          <button
            className="icon-button"
            title="Set Due Date"
            onClick={() => setIsDatePickerVisible(!isDatePickerVisible)}
          >
            <i className="fas fa-calendar-alt"></i>
          </button>
          {isDatePickerVisible && (
            <div className="bulk-date-picker">
              <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} autoFocus />
              <button onClick={handleConfirmDueDate} className="confirm-btn">Set</button>
              <button onClick={() => setIsDatePickerVisible(false)} className="cancel-btn">X</button>
            </div>
          )}
        </div>
        <Dropdown trigger={
          <button className="icon-button" title="Change Priority">
            <i className="fas fa-exclamation-circle"></i>
          </button>
        }>
          <button onClick={() => handlePriorityChange('High')}>High</button>
          <button onClick={() => handlePriorityChange('Medium')}>Medium</button>
          <button onClick={() => handlePriorityChange('Low')}>Low</button>
        </Dropdown>
        <button
          className="icon-button"
          title="Copy Selected to Sheet"
          onClick={() => handleBulkCopyAsCsv(selectedTaskIds)}>
          <i className="fas fa-file-excel"></i>
        </button>
        <button
          className="icon-button"
          title="Download Selected as CSV"
          onClick={() => handleBulkDownloadAsCsv(selectedTaskIds)}>
          <i className="fas fa-file-csv"></i>
        </button>
        {selectionType === 'active' && (
          <button
            className="icon-button"
            title="Complete Selected"
            onClick={handleCompleteClick}>
            <i className="fas fa-check-double"></i>
          </button>
        )}
        {selectionType === 'completed' && (
          <button
            className="icon-button"
            title="Reopen Selected"
            onClick={handleReopenClick}>
            <i className="fas fa-undo"></i>
          </button>
        )}
        <button
          className={`icon-button delete-btn ${isConfirmingDelete ? 'confirm-delete' : ''}`}
          title="Delete Selected"
          onClick={handleDeleteClick}
        >
          <i className={`fas ${isConfirmingDelete ? 'fa-check' : 'fa-trash'}`}></i>
        </button>
      </div>
    </div>
  );
}