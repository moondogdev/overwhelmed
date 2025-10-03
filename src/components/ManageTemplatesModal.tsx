import React from 'react';
import { Settings, ChecklistTemplate } from '../types';
import './styles/Modal.css';

interface ManageTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ChecklistTemplate[];
  onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
  showToast: (message: string) => void;
}

export function ManageTemplatesModal({ isOpen, onClose, templates, onSettingsChange, showToast }: ManageTemplatesModalProps) {
  const [editingTemplateId, setEditingTemplateId] = React.useState<number | null>(null);
  const [editingTemplateName, setEditingTemplateName] = React.useState('');
  const [confirmingDeleteTemplateId, setConfirmingDeleteTemplateId] = React.useState<number | null>(null);
  const confirmTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (editingTemplateId !== null) {
      const currentTemplate = templates.find(t => t.id === editingTemplateId);
      if (currentTemplate) setEditingTemplateName(currentTemplate.name);
    }
  }, [templates, editingTemplateId]);

  if (!isOpen) return null;

  const handleRename = (templateId: number, newName: string) => {
    onSettingsChange(prevSettings => ({
      ...prevSettings,
      checklistTemplates: (prevSettings.checklistTemplates || []).map(t =>
        t.id === templateId ? { ...t, name: newName } : t
      ),
    }));
    setEditingTemplateId(null);
    showToast('Template renamed!');
  };

  const handleDelete = (templateId: number) => {
    if (confirmingDeleteTemplateId === templateId) {
      onSettingsChange(prevSettings => ({
        ...prevSettings,
        checklistTemplates: (prevSettings.checklistTemplates || []).filter(t => t.id !== templateId),
      }));
      showToast('Template deleted!');
      setConfirmingDeleteTemplateId(null);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    } else {
      setConfirmingDeleteTemplateId(templateId);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteTemplateId(null), 3000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h4>Manage Checklist Templates</h4>
        <div className="template-management-list">
          {templates.map(template => (
            <div key={template.id} className="template-management-item">
              {editingTemplateId === template.id ? (
                <input
                  type="text"
                  value={editingTemplateName}
                  onChange={e => setEditingTemplateName(e.target.value)}
                  onBlur={() => handleRename(template.id, editingTemplateName)}
                  onKeyDown={e => e.key === 'Enter' && handleRename(template.id, editingTemplateName)}
                  autoFocus
                />
              ) : (
                <span className="template-name">{template.name}</span>
              )}
              <div className="template-actions">
                <button className="icon-button" onClick={() => { setEditingTemplateId(template.id); setEditingTemplateName(template.name); }} title="Rename Template">
                  <i className="fas fa-pencil-alt"></i>
                </button>
                <button className={`icon-button delete-icon ${confirmingDeleteTemplateId === template.id ? 'confirm-delete' : ''}`} onClick={() => handleDelete(template.id)} title="Delete Template">
                  <i className={`fas ${confirmingDeleteTemplateId === template.id ? 'fa-check' : 'fa-trash'}`}></i>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}