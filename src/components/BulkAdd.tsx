import React from 'react';
import { SimpleAccordion } from './SidebarComponents';
import { useAppContext } from '../contexts/AppContext';

export function BulkAdd() {
  const { bulkAddText, setBulkAddText, handleBulkAdd } = useAppContext();
  return (
    <SimpleAccordion title="Bulk Add">
      <textarea
        placeholder="Paste comma-separated words here..."
        value={bulkAddText}
        onChange={(e) => setBulkAddText(e.target.value)}
        rows={3}
      />
      <button onClick={handleBulkAdd}>Add Words</button>
    </SimpleAccordion>
  );
}