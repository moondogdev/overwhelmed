import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { SimpleAccordion } from './SidebarComponents';
import { PromptModal } from './Editors';
import { defaultSettings } from '../config';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export function BackupManager() {
    const { 
        showToast, settings, setSettings, isPromptOpen, setIsPromptOpen, 
        setWords, setCompletedWords, setInboxMessages, words, completedWords 
    } = useAppContext();
    
    const [backups, setBackups] = useState<{ name: string, path: string, time: number, size: number }[]>([]);
    const [backupSearchQuery, setBackupSearchQuery] = useState('');
    const [activeBackupTab, setActiveBackupTab] = useState<'automatic' | 'manual'>('automatic');
    const [selectedBackup, setSelectedBackup] = useState<{ name: string, path: string } | null>(null);
    const [backupPreview, setBackupPreview] = useState<any>(null);

    const fetchBackups = async () => {
        const backupFiles = await window.electronAPI.getBackups();
        setBackups(backupFiles);
    };

    const handleRestoreClick = () => {
        fetchBackups();
        setActiveBackupTab('automatic'); // Default to automatic tab on open
        setSelectedBackup(null); // Clear any previous selection    
        setBackupSearchQuery(''); // Clear search on open
    };

    const handleManualBackupConfirm = async (backupName: string) => {
        const result = await window.electronAPI.createManualBackup(backupName);
        setIsPromptOpen(false); // Close the prompt modal
        if (result.success) {
            showToast(`Manual backup "${backupName}" created!`);
            fetchBackups(); // Refresh the backup list if the modal is open
        } else {
            showToast('Failed to create manual backup.');
        }
    };

    const handleSelectBackupForRestore = async (backup: { name: string, path: string }) => {
        setSelectedBackup(backup);
        const jsonString = await window.electronAPI.restoreBackup(backup.path);
        if (jsonString) {
            try {
                const data = JSON.parse(jsonString);
                setBackupPreview(data);
            } catch (e) {
                console.error("Failed to parse backup preview", e);
                setBackupPreview({ error: "Could not read backup file." });
            }
        }
    };

    const onRestore = (data: any) => {
        setWords(data.words || []);
        setCompletedWords(data.completedWords || []);
        setSettings(prev => ({ ...defaultSettings, ...data.settings }));
        if (data.inboxMessages) setInboxMessages(data.inboxMessages);
        showToast('Backup restored successfully!');
    };

    const handleRestoreConfirm = () => {
        if (backupPreview && !backupPreview.error) {
            onRestore(backupPreview);
        }
    };

    const handleMergeConfirm = () => {
        if (backupPreview && !backupPreview.error) {
            const backupWords = backupPreview.words || [];
            const backupCompletedWords = backupPreview.completedWords || [];

            // Combine and de-duplicate based on task ID
            const mergedWords = [...words, ...backupWords];
            const uniqueWords = Array.from(new Map(mergedWords.map(item => [item.id, item])).values());

            const mergedCompletedWords = [...completedWords, ...backupCompletedWords];
            const uniqueCompletedWords = Array.from(new Map(mergedCompletedWords.map(item => [item.id, item])).values());

            onRestore({ words: uniqueWords, completedWords: uniqueCompletedWords, settings: settings }); // Keep current settings
        }
    };

    const handleDeleteBackup = async (backup: { name: string, path: string }) => {
        if (window.confirm(`Are you sure you want to permanently delete the backup "${backup.name}"?`)) {
            const result = await window.electronAPI.deleteBackup(backup.path);
            if (result.success) {
                showToast('Backup deleted.');
                fetchBackups(); // Refresh the list
            } else {
                alert(`Failed to delete backup: ${result.error || 'Unknown error'}`);
            }
        }
    };

    const getFilteredBackups = (type: 'automatic' | 'manual') => {
        return backups.filter(backup => {
            const isManual = backup.name.startsWith('manual-');
            if ((type === 'manual' && !isManual) || (type === 'automatic' && isManual)) {
                return false;
            }

            const searchQuery = backupSearchQuery.toLowerCase();
            if (isManual) {
                const parts = backup.name.replace('.json', '').split('-');
                const manualName = parts.slice(3).join(' ').toLowerCase();
                return manualName.includes(searchQuery);
            } else {
                return new Date(backup.time).toLocaleString().toLowerCase().includes(searchQuery);
            }
        });
    };
    const displayedBackups = getFilteredBackups(activeBackupTab);

    return (
        <SimpleAccordion title="Backups & Recovery">
            <PromptModal
                isOpen={isPromptOpen}
                title="Create Manual Backup"
                placeholder="Enter a name for this backup..."
                onClose={() => setIsPromptOpen(false)}
                onConfirm={handleManualBackupConfirm}
            />
            <div className="button-group" style={{ margin: '10px 0' }}>
                <button style={{ fontSize: '10px' }} onClick={() => setIsPromptOpen(true)}>Create Manual Backup</button>
                <button style={{ fontSize: '10px' }} onClick={handleRestoreClick} disabled>Restore from Backup</button>
            </div>
            <label className="backup-setting-label">
                Automatic Backups to Keep:
                <div className="button-group" style={{ margin: '10px 0 0' }}>
                    <input type="number" min="1" value={settings.autoBackupLimit} onChange={(e) => setSettings(prev => ({ ...prev, autoBackupLimit: Number(e.target.value) }))} /><button className="icon-button" style={{ fontSize: '10px', margin: '0 0 10px' }} onClick={() => window.electronAPI.openBackupsFolder()} title="Open backups folder in your file explorer"><i className="fas fa-folder-open"></i></button>
                </div>
                <p style={{ fontSize: '12px', margin: '0' }}>Automatic backups are taken every session start.</p>
            </label>

            {false && (
                <div className="modal-overlay" onClick={() => setIsPromptOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h4>Select a backup to restore</h4>
                        <div className="tab-headers">
                            <button onClick={() => setActiveBackupTab('automatic')} className={activeBackupTab === 'automatic' ? 'active' : ''}>Automatic</button>
                            <button onClick={() => setActiveBackupTab('manual')} className={activeBackupTab === 'manual' ? 'active' : ''}>Manual</button>
                        </div>
                        <input
                            type="text"
                            placeholder="Search backups..."
                            value={backupSearchQuery}
                            onChange={(e) => setBackupSearchQuery(e.target.value)}
                            style={{ margin: '10px 0' }}
                        />
                        <ul className="backup-list">
                            {displayedBackups.length > 0 ? displayedBackups.map(backup => (
                                <li key={backup.path} className={backup.name.startsWith('manual-') ? 'manual-backup' : ''}>
                                    <div className="backup-info" onClick={() => handleSelectBackupForRestore(backup)} title={`Restore ${backup.name}`}>
                                        <span className="backup-date">
                                            {(() => {
                                                if (backup.name.startsWith('manual-')) {
                                                    // Extracts the user-given name from 'manual-YYYY-MM-DD-the-name.json'
                                                    const parts = backup.name.replace('.json', '').split('-');
                                                    return parts.slice(3).join(' ');
                                                }
                                                // For automatic backups, show the full date/time
                                                return new Date(backup.time).toLocaleString();
                                            })()}
                                        </span>
                                        <span className="backup-size">{formatBytes(backup.size)}</span>
                                    </div>
                                    <button className="icon-button delete-backup-btn" title="Delete this backup" onClick={(e) => { e.stopPropagation(); handleDeleteBackup(backup); }}><i className="fas fa-trash"></i>
                                    </button>
                                    <button className="icon-button export-backup-btn" title="Export this backup" onClick={(e) => { e.stopPropagation(); window.electronAPI.exportBackup({ backupPath: backup.path, backupName: backup.name }); }}><i className="fas fa-file-export"></i>
                                    </button>
                                </li>
                            )) : (
                                <li className="no-backups-message">No {activeBackupTab} backups found.</li>
                            )}
                        </ul>
                        <button onClick={() => setIsPromptOpen(false)}>Cancel</button>
                    </div>
                    {selectedBackup && backupPreview && (
                        <div className="modal-overlay" onClick={() => setSelectedBackup(null)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h4>Restore Confirmation</h4>
                                <p>Are you sure you want to restore this backup? This will overwrite your current session.</p>
                                <div className="backup-preview">
                                    <strong>Backup Details:</strong>
                                    <p>Name: {selectedBackup.name}</p>
                                    <p>Open Tasks: {backupPreview.words?.length || 0}</p>
                                    <p>Completed Tasks: {backupPreview.completedWords?.length || 0}</p>
                                </div>
                                <div className="modal-actions">
                                    <button onClick={handleMergeConfirm}>Merge with Session</button>
                                    <button onClick={handleRestoreConfirm} className="confirm-btn">Restore</button>
                                    <button onClick={() => setSelectedBackup(null)}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </SimpleAccordion>
    );
}