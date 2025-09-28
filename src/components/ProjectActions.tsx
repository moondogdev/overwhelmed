import React from 'react';
import { SimpleAccordion } from './SidebarComponents';
import { useAppContext } from '../contexts/AppContext';

export function ProjectActions() {
  const { handleExport, handleImport } = useAppContext();
  return (
    <SimpleAccordion title="Project Actions">
      <div className='button-group'>
        <button onClick={handleExport}>Export Project</button>
        <button onClick={handleImport}>Import Project</button>
      </div>
    </SimpleAccordion>
  );
}