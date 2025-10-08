import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { moveCategory } from '../utils';
import { SimpleAccordion } from './SidebarComponents';
import { Category } from '../types';

export function TransactionAutocategorizeSettings() {
  const { settings, setSettings, tasks, setTasks, handleSyncTransactionTypes, showToast } = useAppContext();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [newlyAddedCatId, setNewlyAddedCatId] = useState<number | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [bulkKeywordsText, setBulkKeywordsText] = useState('');
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const newCatInputRef = useRef<HTMLInputElement>(null);
  const id = -3; // A unique negative ID for this accordion
  const isOpen = (settings.openAccordionIds || []).includes(id);

  const handleToggle = (newIsOpen: boolean) => {
    setSettings(prev => {
      const currentOpenIds = prev.openAccordionIds || [];
      const newOpenIds = newIsOpen
        ? [...currentOpenIds, id]
        : currentOpenIds.filter(i => i !== id);
      return { ...prev, openAccordionIds: newOpenIds };
    });
  };

  useEffect(() => {
    if (isOpen) {
      // Use a timeout to ensure the element is visible and focusable after the accordion animation.
      setTimeout(() => {
        addButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (newlyAddedCatId && newCatInputRef.current) {
      newCatInputRef.current.focus();
      newCatInputRef.current.select(); // Select the text for easy replacement
    }
  }, [newlyAddedCatId]);

  const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');

  // If the main "Transactions" category doesn't exist, don't render this component.
  if (!transactionsCategory) {
    return null;
  }

  const transactionSubCategories = settings.categories.filter(c => c.parentId === transactionsCategory.id);

  const handleAddTransactionSubCategory = () => {
    const newSubCategory: Category = {
      id: Date.now() + Math.random(), // Use random to ensure uniqueness
      name: 'New Transaction Category',
      parentId: transactionsCategory.id,
      autoCategorizationKeywords: [],
    };
    setSettings(prev => ({ ...prev, categories: [...prev.categories, newSubCategory] }));
    setNewlyAddedCatId(newSubCategory.id); // Track the new category to focus it
  };

  const handleUpdateSubCategory = (id: number, updates: Partial<Category>) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.map(cat => cat.id === id ? { ...cat, ...updates } : cat)
    }));
  };

  const handleDeleteSubCategory = (subCat: Category) => {
    if (confirmingDeleteId === subCat.id) {
      setSettings(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.id !== subCat.id)
      }));
      setTasks(prevTasks => prevTasks.map(task =>
        task.categoryId === subCat.id ? { ...task, categoryId: transactionsCategory.id } : task
      ));
      setConfirmingDeleteId(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteId(subCat.id);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => {
        setConfirmingDeleteId(null);
      }, 3000);
    }
  };

  const handleBulkAddKeywords = () => {
    if (!transactionsCategory || !bulkKeywordsText.trim()) return;

    const lines = bulkKeywordsText.trim().split('\n');
    let updatedCategories = [...settings.categories];
    let createdCount = 0;
    let updatedCount = 0;

    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length < 2) return;

      const categoryName = parts[0].trim();
      const keywords = parts.slice(1).join(':').split(',').map(k => k.trim()).filter(Boolean);

      const existingCategory = updatedCategories.find(c => c.parentId === transactionsCategory.id && c.name.toLowerCase() === categoryName.toLowerCase());

      if (existingCategory) {
        // Update existing category's keywords
        const newKeywords = Array.from(new Set([...(existingCategory.autoCategorizationKeywords || []), ...keywords]));
        updatedCategories = updatedCategories.map(c => c.id === existingCategory.id ? { ...c, autoCategorizationKeywords: newKeywords } : c);
        updatedCount++;
      } else {
        // Create new category
        const newCategory: Category = { id: Date.now() + Math.random(), name: categoryName, parentId: transactionsCategory.id, autoCategorizationKeywords: keywords };
        updatedCategories.push(newCategory);
        createdCount++;
      }
    });

    setSettings(prev => ({ ...prev, categories: updatedCategories }));
    setBulkKeywordsText('');
  };

  const handleCopyAllKeywords = () => {
    if (!transactionsCategory) return;

    const subCategoriesWithKeywords = settings.categories.filter(
      c => c.parentId === transactionsCategory.id && c.autoCategorizationKeywords && c.autoCategorizationKeywords.length > 0
    );

    if (subCategoriesWithKeywords.length === 0) {
      showToast('No keywords to copy.');
      return;
    }

    const textToCopy = subCategoriesWithKeywords
      .map(subCat => `${subCat.name}: ${subCat.autoCategorizationKeywords.join(', ')}`)
      .join('\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('All keywords copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy keywords: ', err);
      showToast('Failed to copy keywords.');
    });
  };

  return (
    <SimpleAccordion title="Transaction Autocategorize Settings" startOpen={isOpen} onToggle={handleToggle}>
      <label className="checkbox-label flexed-column" style={{ marginBottom: '10px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
        <input
          type="checkbox"
          checked={settings.autoCategorizeOnBulkAdd || false}
          onChange={(e) => setSettings(prev => ({ ...prev, autoCategorizeOnBulkAdd: e.target.checked }))}
        />
        <span className='checkbox-label-text'>Auto-categorize on Bulk Add</span>
        <p style={{ fontSize: '12px', margin: '5px 0 0 0', color: '#888' }}>Automatically run categorization rules on new transactions added via the 'Bulk Add Tasks' form.</p>
      </label>
      <div className="category-manager-list">
        {transactionSubCategories.map(subCat => (
          <div key={subCat.id} className="category-manager-group">
            <div className="category-manager-item sub">
              <input
                ref={newlyAddedCatId === subCat.id ? newCatInputRef : null}
                type="text"
                defaultValue={subCat.name}
                onBlur={(e) => {
                  handleUpdateSubCategory(subCat.id, { name: e.target.value });
                  // Clear the tracking state after editing is done
                  if (newlyAddedCatId === subCat.id) setNewlyAddedCatId(null);
                }}
              />
              <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, subCat.id, 'up') }))} title="Move Up"><i className="fas fa-arrow-up"></i></button>
              <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, subCat.id, 'down') }))} title="Move Down"><i className="fas fa-arrow-down"></i></button>
              <button className={`remove-link-btn ${confirmingDeleteId === subCat.id ? 'confirm-delete' : ''}`} onClick={() => handleDeleteSubCategory(subCat)} title="Delete Category">
                <i className={`fas ${confirmingDeleteId === subCat.id ? 'fa-check' : 'fa-minus'}`}></i>
              </button>
            </div>
            <div className="category-manager-item sub keywords">
              <input
                type="text"
                placeholder="Auto-categorize keywords (comma-separated)..."
                defaultValue={(subCat.autoCategorizationKeywords || []).join(', ')}
                onBlur={(e) => handleUpdateSubCategory(subCat.id, { autoCategorizationKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
              />
            </div>
            <div className="category-manager-item sub keywords">
              <input
                type="number"
                min="1"
                max="100"
                placeholder="Deductible % (default 100)"
                defaultValue={subCat.deductiblePercentage || ''}
                onBlur={(e) => {
                  const percentage = parseInt(e.target.value, 10);
                  handleUpdateSubCategory(subCat.id, { deductiblePercentage: isNaN(percentage) ? undefined : Math.max(1, Math.min(100, percentage)) });
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <button ref={addButtonRef} className="add-link-btn" onClick={handleAddTransactionSubCategory}><i className="fas fa-plus"></i> Add Transaction Category</button>
      <div className="bulk-add-container" style={{ marginTop: '15px' }}>
        <textarea
          value={bulkKeywordsText}
          onChange={(e) => setBulkKeywordsText(e.target.value)}
          placeholder="Bulk add keywords (e.g., Cash: cash, zelle, cashapp)"
          rows={4}
        />
        <button onClick={handleBulkAddKeywords}>
          <i className="fas fa-plus-square"></i> Bulk Add Keywords
        </button>
        <button onClick={handleCopyAllKeywords}>
          <i className="fas fa-copy"></i> Copy All Keywords
        </button>
      </div>
      <hr style={{ margin: '15px 0' }} />
      <button onClick={handleSyncTransactionTypes} title="One-time action to fix legacy transaction types.">
        <i className="fas fa-sync-alt"></i> Sync Transaction Types
      </button>
    </SimpleAccordion>
  );
}