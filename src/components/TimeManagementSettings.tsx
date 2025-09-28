import React from 'react';
import { SimpleAccordion } from './SidebarComponents';
import { useAppContext } from '../contexts/AppContext';

export function TimeManagementSettings() {
  const { settings, setSettings, snoozeTimeSelectRef } = useAppContext();
  const id = -2; // A unique negative ID for this accordion
  const isOpen = settings.openAccordionIds.includes(id);

  const handleToggle = (newIsOpen: boolean) => {
    setSettings(prev => {
      const newOpenIds = newIsOpen 
        ? [...prev.openAccordionIds, id] 
        : prev.openAccordionIds.filter(i => i !== id);
      return { ...prev, openAccordionIds: newOpenIds };
    });
  };
  return (
    <SimpleAccordion title="Time Management" startOpen={isOpen} onToggle={handleToggle}>
      <label>
        Warning Time (minutes):
        <input type="number" value={settings.warningTime} onChange={(e) => setSettings(prev => ({ ...prev, warningTime: Number(e.target.value) }))} />
      </label>
      <label>
        Timer Alert Level:
        <select value={settings.timerNotificationLevel} onChange={(e) => setSettings(prev => ({ ...prev, timerNotificationLevel: e.target.value as any }))}>
          <option value="silent">Silent</option>
          <option value="low">Low (Once at 15m)</option>
          <option value="medium">Medium (Every 15m in last hour)</option>
          <option value="high">High (Hourly + every 15m in last hour)</option>
        </select>
      </label>
      <label>
        Snooze Time:
        <select ref={snoozeTimeSelectRef} value={settings.snoozeTime} onChange={(e) => setSettings(prev => ({ ...prev, snoozeTime: e.target.value as any }))}>
          <option value="low">Low (1 minute)</option>
          <option value="medium">Medium (5 minutes)</option>
          <option value="high">High (10 minutes)</option>
        </select>
        <p style={{ fontSize: '12px', margin: '0' }}>How long to hide an overdue alert when you click "Snooze".</p>
      </label>
    </SimpleAccordion>
  );
}