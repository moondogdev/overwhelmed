import React, { useState } from 'react';
import { InboxMessage, Settings } from '../types';
import { formatTimestamp } from '../utils';
import { SimpleAccordion } from './SidebarComponents';
import { useAppContext } from '../contexts/AppContext';
import './styles/InboxView.css'

export function InboxView() {
  const {
    inboxMessages,
    archivedMessages,
    trashedMessages,
    settings,
    setSettings,
    handleInboxItemClick,
    handleToggleImportant,
    handleArchiveInboxMessage,
    handleDismissInboxMessage,
    handleUnarchiveInboxMessage,
    handleDismissArchivedMessage,
    handleRestoreFromTrash,
    handleDeletePermanently,
    handleRestoreAllFromTrash,
    handleEmptyTrash,
    handleTrashAllArchived,
    handleDismissAllInboxMessages,
  } = useAppContext();
  const [activeInboxTab, setActiveInboxTab] = useState<'active' | 'archived' | 'trash'>('active');

  return (
    <div className="inbox-view">
      <div className="list-header">
        <h3>Inbox</h3>
        <div className="list-header-actions">
          <div className="inbox-sort-control">
            <label>Sort by:</label>
            <select value={settings.inboxSort || 'date-desc'} onChange={(e) => setSettings(prev => ({ ...prev, inboxSort: e.target.value as any }))}>
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="type">Message Type</option>
            </select>
          </div>
          <button onClick={handleDismissAllInboxMessages} title="Clear All Non-Important Messages"><i className="fas fa-trash"></i> Clear All</button>
        </div>
      </div>
      <div className="tab-headers">
        <button onClick={() => setActiveInboxTab('active')} className={activeInboxTab === 'active' ? 'active' : ''}>Active ({inboxMessages.length})</button>
        <button onClick={() => setActiveInboxTab('archived')} className={activeInboxTab === 'archived' ? 'active' : ''}>Archived ({archivedMessages.length})</button>
        <button onClick={() => setActiveInboxTab('trash')} className={activeInboxTab === 'trash' ? 'active' : ''}>Trash ({trashedMessages.length})</button>
      </div>
      {activeInboxTab === 'active' && (() => {
        if (inboxMessages.length === 0) {
          return <p>Your inbox is empty.</p>;
        }
        if (settings.inboxSort === 'type') {
          const groupedMessages = inboxMessages.reduce((acc, message) => {
            const type = message.type;
            if (!acc[type]) acc[type] = [];
            acc[type].push(message);
            return acc;
          }, {} as Record<string, InboxMessage[]>);

          for (const type in groupedMessages) {
            groupedMessages[type].sort((a, b) => b.timestamp - a.timestamp);
          }

          return (
            <div className="inbox-list">
              {Object.entries(groupedMessages).map(([type, messages]) => (
                <SimpleAccordion key={`${type}-${messages[0]?.id || 0}`} title={`${type.charAt(0).toUpperCase() + type.slice(1)} (${messages.length})`} startOpen={(settings.openInboxGroupTypes || []).includes(type)} onToggle={(isOpen) => { const newOpenTypes = isOpen ? [...(settings.openInboxGroupTypes || []), type] : (settings.openInboxGroupTypes || []).filter(t => t !== type); setSettings(prev => ({ ...prev, openInboxGroupTypes: newOpenTypes })); }}>
                  <div className="inbox-group">
                    {messages.map(message => (
                      <div key={message.id} className={`inbox-item inbox-item-${message.type} ${message.wordId ? 'clickable' : ''}`} onClick={() => handleInboxItemClick(message)} onContextMenu={(e) => { if (message.type !== 'created' && message.type !== 'deleted' && message.type !== 'updated' && message.type !== 'completed') { e.preventDefault(); window.electronAPI.showInboxItemContextMenu({ message, x: e.clientX, y: e.clientY }); } else { e.preventDefault(); } }}>
                        <span className="inbox-item-icon"><i className={`fas ${message.type === 'overdue' ? 'fa-exclamation-triangle' : message.type === 'timer-alert' ? 'fa-bell' : message.type === 'created' ? 'fa-magic' : message.type === 'completed' ? 'fa-check-circle' : message.type === 'deleted' ? 'fa-trash-alt' : 'fa-pencil-alt'}`}></i></span>
                        <span className="inbox-item-text">{message.text}</span><span className="inbox-item-timestamp">{formatTimestamp(message.timestamp)}</span>
                        <div className="inbox-message-actions">
                          <button className="inbox-message-action-btn important-btn" title={message.isImportant ? "Unmark as important" : "Mark as important"} onClick={(e) => { e.stopPropagation(); handleToggleImportant(message.id); }}><i className={`fas fa-star ${message.isImportant ? 'important' : ''}`}></i></button>
                          <button className="inbox-message-action-btn archive-btn" title="Archive Message" onClick={(e) => { e.stopPropagation(); handleArchiveInboxMessage(message.id); }}><i className="fas fa-archive"></i></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDismissInboxMessage(message.id); }} className="inbox-message-action-btn remove-btn" title="Dismiss Message"><i className="fas fa-times"></i></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </SimpleAccordion>
              ))}
            </div>
          );
        }

        const sortedMessages = [...inboxMessages].sort((a, b) => {
          if (settings.inboxSort === 'date-asc') return a.timestamp - b.timestamp;
          if (settings.inboxSort === 'type') return a.type.localeCompare(b.type) || b.timestamp - a.timestamp;
          return b.timestamp - a.timestamp;
        });

        return (
          <div className="inbox-list">
            {sortedMessages.map(message => (
              <div key={message.id} className={`inbox-item inbox-item-${message.type} ${message.wordId ? 'clickable' : ''}`} onClick={() => handleInboxItemClick(message)} onContextMenu={(e) => { if (message.type !== 'created' && message.type !== 'deleted' && message.type !== 'updated' && message.type !== 'completed') { e.preventDefault(); window.electronAPI.showInboxItemContextMenu({ message, x: e.clientX, y: e.clientY }); } else { e.preventDefault(); } }}>
                <span className="inbox-item-icon"><i className={`fas ${message.type === 'overdue' ? 'fa-exclamation-triangle' : message.type === 'timer-alert' ? 'fa-bell' : message.type === 'created' ? 'fa-magic' : message.type === 'completed' ? 'fa-check-circle' : message.type === 'deleted' ? 'fa-trash-alt' : 'fa-pencil-alt'}`}></i></span>
                <span className="inbox-item-text">{message.text}</span><span className="inbox-item-timestamp">{formatTimestamp(message.timestamp)}</span>
                <div className="inbox-message-actions">
                  <button className="inbox-message-action-btn important-btn" title={message.isImportant ? "Unmark as important" : "Mark as important"} onClick={(e) => { e.stopPropagation(); handleToggleImportant(message.id); }}><i className={`fas fa-star ${message.isImportant ? 'important' : ''}`}></i></button>
                  <button className="inbox-message-action-btn archive-btn" title="Archive Message" onClick={(e) => { e.stopPropagation(); handleArchiveInboxMessage(message.id); }}><i className="fas fa-archive"></i></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDismissInboxMessage(message.id); }} className="inbox-message-action-btn" title="Dismiss Message"><i className="fas fa-times"></i></button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
      {activeInboxTab === 'archived' && (() => {
        if (archivedMessages.length === 0) {
          return <p>Your archive is empty.</p>;
        }
        const sortedArchived = [...archivedMessages].sort((a, b) => b.timestamp - a.timestamp);
        const archiveHeader = (
          <div className="list-header">
            <button onClick={() => { if (window.confirm('Are you sure you want to un-archive all messages?')) { archivedMessages.forEach(msg => handleUnarchiveInboxMessage(msg.id)); } }} title="Un-archive all messages"><i className="fas fa-undo-alt"></i> Un-archive All</button><button onClick={handleTrashAllArchived} title="Move all archived messages to trash"><i className="fas fa-trash"></i> Trash All</button>
          </div>
        );
        return (
          <div className="inbox-list">
            {archiveHeader}
            {sortedArchived.map(message => (
              <div key={message.id} className={`inbox-item inbox-item-${message.type} ${message.wordId ? 'clickable' : ''}`} onClick={() => handleInboxItemClick(message)}>
                <span className="inbox-item-icon"><i className={`fas ${message.type === 'overdue' ? 'fa-exclamation-triangle' : message.type === 'timer-alert' ? 'fa-bell' : 'fa-info-circle'}`}></i></span>
                <span className="inbox-item-text">{message.text}</span>
                <span className="inbox-item-timestamp">{formatTimestamp(message.timestamp)}</span>
                <div className="inbox-message-actions">
                  <button className="inbox-message-action-btn archive-btn" title="Un-archive Message" onClick={(e) => { e.stopPropagation(); handleUnarchiveInboxMessage(message.id); }}><i className="fas fa-undo-alt"></i></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDismissArchivedMessage(message.id); }} className="inbox-message-action-btn remove-btn" title="Move to Trash"><i className="fas fa-times"></i></button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
      {activeInboxTab === 'trash' && (() => {
        if (trashedMessages.length === 0) {
          return <p>Your trash is empty.</p>;
        }
        const sortedTrashed = [...trashedMessages].sort((a, b) => b.timestamp - a.timestamp);
        const trashHeader = (
          <div className="list-header">
            <button onClick={handleRestoreAllFromTrash} title="Restore all messages from trash"><i className="fas fa-undo-alt"></i> Restore All</button><button onClick={handleEmptyTrash} title="Permanently delete all items in trash"><i className="fas fa-dumpster-fire"></i> Empty Trash</button>
          </div>
        );
        return (
          <div className="inbox-list">
            {trashHeader}
            {sortedTrashed.map(message => (
              <div key={message.id} className={`inbox-item inbox-item-${message.type} ${message.wordId ? 'clickable' : ''}`} onClick={() => handleInboxItemClick(message)}>
                <span className="inbox-item-icon"><i className={`fas ${message.type === 'overdue' ? 'fa-exclamation-triangle' : message.type === 'timer-alert' ? 'fa-bell' : 'fa-info-circle'}`}></i></span>
                <span className="inbox-item-text">{message.text}</span>
                <span className="inbox-item-timestamp">{formatTimestamp(message.timestamp)}</span>
                <div className="inbox-message-actions">
                  <button className="inbox-message-action-btn restore-btn" title="Restore Message" onClick={(e) => { e.stopPropagation(); handleRestoreFromTrash(message.id); }}><i className="fas fa-undo-alt"></i></button>
                  <button className="inbox-message-action-btn remove-btn" title="Delete Permanently" onClick={(e) => { e.stopPropagation(); handleDeletePermanently(message.id); }}><i className="fas fa-trash-alt"></i></button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}