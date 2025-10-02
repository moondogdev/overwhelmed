import React, { useState, useEffect } from 'react';
import { Word, Settings, TaskType, AccordionProps } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { PromptModal } from './Editors';
import './styles/Accordion.css';

export function SimpleAccordion({ title, children, startOpen = false, onToggle, className }: AccordionProps & { startOpen?: boolean, onToggle?: (isOpen: boolean) => void, className?: string }) {
    const [isOpen, setIsOpen] = useState(startOpen);

    useEffect(() => {
        // If the startOpen prop is used to control the accordion, update its internal state.
        setIsOpen(startOpen);
    }, [startOpen]);

    return (
        <div className={`accordion ${className || ''}`}>
            <div className="accordion-header" onClick={(e) => {
                e.stopPropagation(); // Stop the click from bubbling up to parent accordions.
                setIsOpen(!isOpen); 
                if (onToggle) onToggle(!isOpen); 
            }}>
                <h4>{title}</h4>
                <span className="accordion-icon">
                    <i className={`fas ${isOpen ? 'fa-minus' : 'fa-plus'}`}></i>
                </span>
            </div>
            <div className={`accordion-content ${isOpen ? 'open' : 'closed'}`}>
                {isOpen && children}
            </div>
        </div>
    );
}

export function LiveClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="live-clock">{time.toLocaleString()}</div>
    );
}

export function TaskTypeManager() {
    const { settings, setSettings } = useAppContext();
    const allPossibleFields: (keyof Word)[] = [
        'text', 'url', 'priority', 'categoryId', 'openDate', 'completeBy', 'company', 'websiteUrl', 'imageLinks', 'payRate', 'isRecurring', 'isDailyRecurring', 'isWeeklyRecurring', 'isMonthlyRecurring', 'isYearlyRecurring', 'isAutocomplete', 'description', 'attachments', 'checklist', 'notes'
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
        if (window.confirm('Are you sure you want to delete this task type?')) {
            const newTypes = (settings.taskTypes || []).filter(t => t.id !== typeId);
            setSettings(prev => ({ ...prev, taskTypes: newTypes }));
        }
    };

    const handleFieldToggle = (typeId: string, fieldName: keyof Word) => {
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
                            <button className="remove-link-btn" onClick={() => handleDeleteTaskType(type.id)}>
                                <i className="fas fa-minus"></i>
                            </button>
                        )}
                    </div>
                    <div className="task-type-fields">
                        {allPossibleFields.map(field => (
                            <label key={field} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={type.fields.includes(field)}
                                    onChange={() => handleFieldToggle(type.id, field)}
                                />
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