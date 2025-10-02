import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ActiveFullTaskView } from './TaskView';
import { Footer } from './Footer';
import { NotificationCenter } from './NotificationCenter';
import { MiniPlayer } from './MiniPlayer';
import { SaveStatus } from './SaveStatus';
import { AppHeader } from './AppHeader';
import { MemeView } from './MemeView';
import { ReportsView } from './ReportsView';
import { InboxView } from './InboxView';
import { ListView } from './ListView';
import { AddNewTaskForm } from './AddNewTaskForm';
import { TaskTypeManager } from './SidebarComponents';
import { GlobalCategorySettings } from './GlobalCategorySettings';
import { CategoryManager } from './CategoryManager';
import { ExternalLinkManager } from './ExternalLinkManager';
import { TimeManagementSettings } from './TimeManagementSettings';
import { BulkAdd } from './BulkAdd';
import { ProjectActions } from './ProjectActions';
import { BackupManager } from './BackupManager';
import { MemeViewSettings } from './MemeViewSettings';
import { WorkSessionManager } from './WorkSessionManager';
import './styles/Sidebar.css';

export function AppLayout() {
    const { settings, setSettings, fullTaskViewId, setFullTaskViewId, words, completedWords, handleWordUpdate } = useAppContext();

    if (fullTaskViewId) {
        const taskToShow = words.find(w => w.id === fullTaskViewId) || completedWords.find(w => w.id === fullTaskViewId);
        if (taskToShow) {
            return <ActiveFullTaskView fullTaskViewId={fullTaskViewId} words={words} completedWords={completedWords} onClose={() => setFullTaskViewId(null)} onUpdate={handleWordUpdate} onSettingsChange={setSettings} />
        }
    }

    return (
        <div className="app-container">
            <div className="main-content">
                <AppHeader />
                {settings.currentView === 'meme' && <MemeView />}
                {settings.currentView === 'reports' && <ReportsView />}
                {settings.currentView === 'inbox' && <InboxView />}
                {settings.currentView === 'list' && <ListView />}
            </div>
            <div className={`sidebar ${settings.isSidebarVisible ? '' : 'hidden'}`}>
                <AddNewTaskForm /> <TaskTypeManager /> <GlobalCategorySettings /> <CategoryManager /> <ExternalLinkManager /> <TimeManagementSettings /> <BulkAdd /> <ProjectActions /> <BackupManager /> {settings.currentView === 'meme' && <MemeViewSettings />}
            </div>
            <Footer />
            <NotificationCenter />
            <MiniPlayer />
            <SaveStatus />
            <WorkSessionManager />
        </div>
    );
}