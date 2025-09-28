import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { SimpleAccordion } from './SidebarComponents';

export function GlobalCategorySettings() {
  const { settings, setSettings } = useAppContext();

  return (
    <SimpleAccordion title="Global Category Settings">
      <div className="category-manager-item">
        <span>"All" Category Color:</span>
        <input
          type="color"
          value={settings.allCategoryColor || '#4a4f5b'}
          className="category-color-picker"
          onChange={(e) => setSettings(prev => ({ ...prev, allCategoryColor: e.target.value }))}
        />
        <button
          className="icon-button"
          onClick={() => setSettings(prev => ({ ...prev, allCategoryColor: undefined }))}
          title="Reset Color"
        >
          <i className="fas fa-times-circle"></i>
        </button>
      </div>
    </SimpleAccordion>
  );
}