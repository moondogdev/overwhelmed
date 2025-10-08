import React from 'react';
import { SimpleAccordion } from '../SidebarComponents';
import { useAppContext } from '../../contexts/AppContext';
import { InboxMessage } from '../../types';

export function NotificationSettings() {
  const { settings, setSettings } = useAppContext();

  const handleFilterChange = (type: InboxMessage['type'], isEnabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      inboxMessageFilters: {
        ...prev.inboxMessageFilters,
        [type]: isEnabled,
      },
    }));
  };

  const messageTypes: { type: InboxMessage['type']; label: string }[] = [
    { type: 'created', label: 'Task Created' },
    { type: 'completed', label: 'Task Completed/Skipped' },
    { type: 'updated', label: 'Task Updated' },
    { type: 'deleted', label: 'Task Deleted' },
    { type: 'overdue', label: 'Task Overdue' },
    { type: 'timer-alert', label: 'Deadline Warnings' },
  ];

  return (
    <SimpleAccordion title="Inbox & Notifications">
      <div className="notification-settings-group">
        <h5>Show in Inbox:</h5>
        {messageTypes.map(({ type, label }) => (
          <label key={type} className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.inboxMessageFilters?.[type] ?? true}
              onChange={(e) => handleFilterChange(type, e.target.checked)}
            />
            <span className="checkbox-label-text">{label}</span>
          </label>
        ))}
      </div>
    </SimpleAccordion>
  );
}