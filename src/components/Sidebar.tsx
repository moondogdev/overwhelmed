import React from 'react';
import { AddNewTaskForm } from './AddNewTaskForm';
import { BulkAdd } from './BulkAdd';
import { CategoryManager } from './CategoryManager';
import { MemeViewSettings } from './MemeViewSettings';
import { ExternalLinkManager } from './ExternalLinkManager';
import { TimeManagementSettings } from './TimeManagementSettings';
import { BackupManager } from './BackupManager';
import { ProjectActions } from './ProjectActions';
import { GlobalCategorySettings } from './GlobalCategorySettings';
import { TransactionAutocategorizeSettings } from './TransactionAutocategorizeSettings';
import { AccountManager } from './SidebarComponents';
import { TaxCategoryManager } from './SidebarComponents';
import { NotificationSettings } from './NotificationSettings';
import { TaskTypeManager } from './SidebarComponents';
import './styles/Sidebar.css';

interface SidebarProps {
  isVisible: boolean;
}

export function Sidebar({ isVisible }: SidebarProps) {
  return (
    <div className={`sidebar ${isVisible ? '' : 'hidden'}`}>
      <AddNewTaskForm />
      <BulkAdd />
      <CategoryManager />
      <AccountManager />
      <TransactionAutocategorizeSettings />
      <TaxCategoryManager />
      <TaskTypeManager />
      <MemeViewSettings />
      <TimeManagementSettings />
      <NotificationSettings />
      <ExternalLinkManager />
      <GlobalCategorySettings />
      <ProjectActions />
      <BackupManager />
    </div>
  );
}