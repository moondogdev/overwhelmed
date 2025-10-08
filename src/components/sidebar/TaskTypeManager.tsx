import React, { useState, useRef } from 'react';
import { Task, TaskType } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { SimpleAccordion } from '../sidebar/SimpleAccordion';

export function TaskTypeManager() {
    const { settings, setSettings } = useAppContext();
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const allPossibleFields: (keyof Task)[] = [
        'text', 'url', 'priority', 'categoryId', 'openDate', 'completeBy', 'company', 'websiteUrl', 'imageLinks', 'payRate', 
        'transactionAmount', 'transactionType', 'accountId', 'taxCategoryId', 'isRecurring', 'isDailyRecurring', 'isWeeklyRecurring', 
        'isMonthlyRecurring', 'isYearlyRecurring', 'isAutocomplete', 'description', 'attachments', 'checklist', 'notes'
    ];

    const handleUpdateTaskType = (updatedType: TaskType) => {
        const newTypes = (settings.taskTypes || []).map(t => t.id === updatedType.id ? updatedType : t);
        setSettings(prev => ({ ...prev, taskTypes: newTypes }));
    };

    const handleAddTaskType = () => {
        const newType: TaskType = {
            id: `custom-${Date.now()}`,
            name: 'New Task Type',
            fields: ['text', 'priority', 'completeBy'], // A sensible default
        };
        const newTypes = [...(settings.taskTypes || []), newType];
        setSettings(prev => ({ ...prev, taskTypes: newTypes }));
    };

    const handleDeleteTaskType = (typeId: string) => {
        if (confirmingDeleteId === typeId) {
            const newTypes = (settings.taskTypes || []).filter(t => t.id !== typeId);
            setSettings(prev => ({ ...prev, taskTypes: newTypes }));
            setConfirmingDeleteId(null);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        } else {
            setConfirmingDeleteId(typeId);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteId(null), 3000);
        }
    };

    const handleFieldToggle = (typeId: string, fieldName: keyof Task) => {
        const taskType = (settings.taskTypes || []).find(t => t.id === typeId);
        if (!taskType) return;

        const newFields = taskType.fields.includes(fieldName)
            ? taskType.fields.filter(f => f !== fieldName)
            : [...taskType.fields, fieldName];

        handleUpdateTaskType({ ...taskType, fields: newFields });
    };

    return (
        <SimpleAccordion title="Task Type Manager">
            {(settings.taskTypes || []).map(type => (
                <div key={type.id} className="category-manager-group">
                    <div className="category-manager-item parent">
                        <input
                            type="text"
                            value={type.name}
                            onChange={(e) => handleUpdateTaskType({ ...type, name: e.target.value })}
                            disabled={type.id === 'default'} // Don't allow renaming the default type
                        />
                        {type.id !== 'default' && (
                            <button className={`remove-link-btn ${confirmingDeleteId === type.id ? 'confirm-delete' : ''}`} onClick={() => handleDeleteTaskType(type.id)}>
                                <i className={`fas ${confirmingDeleteId === type.id ? 'fa-check' : 'fa-minus'}`}></i>
                            </button>
                        )}
                    </div>
                    <div className="task-type-fields">
                        {allPossibleFields.map(field => (
                            <label key={field} className="checkbox-label">
                                <input type="checkbox" checked={type.fields.includes(field)} onChange={() => handleFieldToggle(type.id, field)} />
                                <span className="checkbox-label-text">{field}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
            <button className="add-link-btn" onClick={handleAddTaskType}>
                <i className="fas fa-plus"></i> Add Task Type
            </button>
        </SimpleAccordion>
    );
}