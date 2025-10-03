import React from 'react';
import { SimpleAccordion } from './SidebarComponents';
import { useAppContext } from '../contexts/AppContext';
import { CategoryOptions } from './TaskView';

export function BulkAdd() {
  const {
    bulkAddText, setBulkAddText, handleBulkAdd,
    bulkAddCategoryId, setBulkAddCategoryId,
    bulkAddPriority, setBulkAddPriority,
    bulkAddCompleteBy, setBulkAddCompleteBy,
    settings
  } = useAppContext();
  return (
    <SimpleAccordion title="Bulk Add Tasks">
      <div className="bulk-add-options">
        <label>
          Category:
          <select value={bulkAddCategoryId} onChange={(e) => setBulkAddCategoryId(e.target.value === 'default' ? 'default' : Number(e.target.value))}>
            <option value="default">Use Current View</option>
            <CategoryOptions categories={settings.categories} />
          </select>
        </label>
        <label>
          Priority:
          <select value={bulkAddPriority} onChange={(e) => setBulkAddPriority(e.target.value as any)}>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Low">Low</option>
          </select>
        </label>
        <label>
          Due Date:
          <input type="datetime-local" value={bulkAddCompleteBy} onChange={(e) => setBulkAddCompleteBy(e.target.value)} />
        </label>
      </div>
      <textarea
        placeholder="Add multiple tasks, separated by new lines or commas..."
        value={bulkAddText}
        onChange={(e) => setBulkAddText(e.target.value)}
        rows={5}
      />
      <button onClick={() => handleBulkAdd({ categoryId: bulkAddCategoryId, priority: bulkAddPriority, completeBy: bulkAddCompleteBy })}>Add Tasks</button>
    </SimpleAccordion>
  );
}