import React from 'react';
import { AddNewTaskForm } from './sidebar/AddNewTaskForm';
import { BulkAdd } from './sidebar/BulkAdd';
import { CategoryManager } from './sidebar/CategoryManager';
import { MemeViewSettings } from './sidebar/MemeViewSettings';
import { ExternalLinkManager } from './sidebar/ExternalLinkManager';
import { TimeManagementSettings } from './sidebar/TimeManagementSettings';
import { BackupManager } from './sidebar/BackupManager';
import { ProjectActions } from './sidebar/ProjectActions';
import { GlobalCategorySettings } from './sidebar/GlobalCategorySettings';
import { TransactionAutocategorizeSettings } from './sidebar/TransactionAutocategorizeSettings';
import { AccountManager } from './sidebar/AccountManager';
import { VehicleInformationManager } from './sidebar/VehicleInformationManager';
import { BusinessInfoManager } from './sidebar/BusinessInfoManager';
import { DepreciableAssetsManager } from './sidebar/DepreciableAssetsManager';
import { TaxCategoryManager } from './sidebar/TaxCategoryManager';
import { W2Manager } from './sidebar/W2Manager';
import { NotificationSettings } from './sidebar/NotificationSettings';
import { TaskTypeManager } from './sidebar/TaskTypeManager';
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