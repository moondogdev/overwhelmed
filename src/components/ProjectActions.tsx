import React from 'react';
import { SimpleAccordion } from './SidebarComponents';
import { useAppContext } from '../contexts/AppContext';

export function ProjectActions() {
  const { handleExport, handleImport, handleSyncIds } = useAppContext();
  return (
    <SimpleAccordion title="Project Actions">
      <div className='button-group'>
        <button onClick={handleExport}>Export Project</button>
        <button onClick={handleImport}>Import Project</button>
        <button onClick={handleSyncIds} title="Re-indexes all task IDs to prevent duplicates. Use if you suspect ID conflicts.">Sync Task IDs</button>
      </div>
    </SimpleAccordion>
  );
}