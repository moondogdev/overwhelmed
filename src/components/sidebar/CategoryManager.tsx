import React, { useState, useRef } from 'react';
import { Category } from '../../types';
import { moveCategory } from '../../utils';
import { useAppContext } from '../../contexts/AppContext';
import { SimpleAccordion } from '../SidebarComponents';

export function CategoryManager() {
  const { settings, setSettings, tasks, setTasks } = useAppContext();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startConfirmDelete = (id: number) => {
    setConfirmingDeleteId(id);
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteId(null), 3000);
  };

  return (
    <SimpleAccordion className="accordion-category-manager" title="Category Manager">
      {(settings.categories || []).filter(c => !c.parentId).map((parentCat: Category) => (
        <div key={parentCat.id} className="category-manager-group">
          <div className="category-manager-item parent">
            <input
              type="text"
              value={parentCat.name}
              onChange={(e) => {
                const newCategories = (settings.categories || []).map(c => c.id === parentCat.id ? { ...c, name: e.target.value } : c);
                setSettings(prev => ({ ...prev, categories: newCategories }));
              }}
            />
            <input
              type="color"
              value={parentCat.color || '#555555'} // Default to gray
              className="category-color-picker"
              onChange={(e) => {
                const newCategories = (settings.categories || []).map(c => c.id === parentCat.id ? { ...c, color: e.target.value } : c);
                setSettings(prev => ({ ...prev, categories: newCategories }));
              }}
            />
            <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, parentCat.id, 'up') }))} title="Move Up"><i className="fas fa-arrow-up"></i></button>
            <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, parentCat.id, 'down') }))} title="Move Down"><i className="fas fa-arrow-down"></i></button>
            <button className={`remove-link-btn ${confirmingDeleteId === parentCat.id ? 'confirm-delete' : ''}`} onClick={() => {
              if (confirmingDeleteId === parentCat.id) {
                const newCategories = (settings.categories || []).filter(c => c.id !== parentCat.id && c.parentId !== parentCat.id);
                setTasks(tasks.map(w => w.categoryId === parentCat.id ? { ...w, categoryId: undefined } : w));
                setSettings(prev => ({ ...prev, categories: newCategories }));
                setConfirmingDeleteId(null);
                if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
              } else {
                startConfirmDelete(parentCat.id);
              }
            }}><i className={`fas ${confirmingDeleteId === parentCat.id ? 'fa-check' : 'fa-minus'}`}></i></button>
            <button className="add-link-btn" onClick={() => {
              const newSubCategory = { id: Date.now(), name: 'New Sub-Category', parentId: parentCat.id };
              setSettings(prev => ({ ...prev, categories: [...prev.categories, newSubCategory] }));
            }} title="Add Sub-Category"><i className="fas fa-plus"></i></button>
          </div>
          {(settings.categories || []).filter(c => c.parentId === parentCat.id).map((subCat: Category) => (
            <React.Fragment key={subCat.id}>
              <div className="category-manager-item sub">
                <input
                  type="text"
                  value={subCat.name}
                  onChange={(e) => {
                    const newCategories = (settings.categories || []).map(c =>
                      c.id === subCat.id ? { ...c, name: e.target.value } : c
                    );
                    setSettings(prev => ({ ...prev, categories: newCategories }));
                  }}
                />
                <input
                  type="color"
                  value={subCat.color || '#555555'} // Default to gray
                  className="category-color-picker"
                  onChange={(e) => {
                    const newCategories = (settings.categories || []).map(c => c.id === subCat.id ? { ...c, color: e.target.value } : c);
                    setSettings(prev => ({ ...prev, categories: newCategories }));
                  }}
                />
                <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, subCat.id, 'up') }))} title="Move Up"><i className="fas fa-arrow-up"></i></button>
                <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, subCat.id, 'down') }))} title="Move Down"><i className="fas fa-arrow-down"></i></button>
              <button className={`remove-link-btn ${confirmingDeleteId === subCat.id ? 'confirm-delete' : ''}`} onClick={() => {
                if (confirmingDeleteId === subCat.id) {
                  const newCategories = (settings.categories || []).filter(c => c.id !== subCat.id);
                  setTasks(tasks.map(w => w.categoryId === subCat.id ? { ...w, categoryId: parentCat.id } : w));
                  setSettings(prev => ({ ...prev, categories: newCategories }));
                  setConfirmingDeleteId(null);
                  if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                } else {
                  startConfirmDelete(subCat.id);
                  }
              }}><i className={`fas ${confirmingDeleteId === subCat.id ? 'fa-check' : 'fa-minus'}`}></i></button>
              </div>
            </React.Fragment>
          ))}
        </div>
      ))}
      <button className="add-link-btn" onClick={() => setSettings(prev => ({ ...prev, categories: [...prev.categories, { id: Date.now(), name: 'New Category' }] }))}><i className="fas fa-plus"></i> Add Category
      </button>
    </SimpleAccordion>
  );
}