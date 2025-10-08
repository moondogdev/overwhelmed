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
import { AccountManager, VehicleInformationManager, BusinessInfoManager, DepreciableAssetsManager } from './SidebarComponents';
import { TaxCategoryManager, W2Manager } from './SidebarComponents'; 
import { NotificationSettings } from './NotificationSettings';
import { TaskTypeManager } from './SidebarComponents';
import './styles/Sidebar.css';

interface SidebarProps {
  sidebarState: 'visible' | 'focused' | 'hidden';
}

export function Sidebar({ sidebarState }: SidebarProps) {
  return (
    <div className={`sidebar ${sidebarState}`}>
      <AddNewTaskForm />
      <BulkAdd />
      <CategoryManager />
      <AccountManager />
      <TransactionAutocategorizeSettings />
      <TaxCategoryManager />
      <BusinessInfoManager />
      <DepreciableAssetsManager />
      <VehicleInformationManager />
      <W2Manager />
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