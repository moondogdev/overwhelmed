import React, { useState, useEffect, useRef } from 'react';
import { Task, Settings, TaskType, AccordionProps, Account } from '../types';
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
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const allPossibleFields: (keyof Task)[] = [
        'text', 'url', 'priority', 'categoryId', 'openDate', 'completeBy', 'company', 'websiteUrl', 'imageLinks', 'payRate', 'transactionAmount', 'transactionType', 'isRecurring', 'isDailyRecurring', 'isWeeklyRecurring', 'isMonthlyRecurring', 'isYearlyRecurring', 'isAutocomplete', 'description', 'attachments', 'checklist', 'notes'
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

export function AccountManager() {
    const { settings, setSettings } = useAppContext();
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
    const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleAddAccount = () => {
        const newAccount: Account = { id: Date.now(), name: 'New Account' };
        setSettings(prev => ({ ...prev, accounts: [...prev.accounts, newAccount] }));
    };

    const handleUpdateAccount = (id: number, name: string) => {
        setSettings(prev => ({
            ...prev,
            accounts: prev.accounts.map(acc => acc.id === id ? { ...acc, name } : acc)
        }));
    };

    const handleDeleteAccount = (id: number) => {
        if (confirmingDeleteId === id) {
            setSettings(prev => ({ ...prev, accounts: prev.accounts.filter(acc => acc.id !== id) }));
            setConfirmingDeleteId(null);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        } else {
            setConfirmingDeleteId(id);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteId(null), 3000);
        }
    };

    return (
        <SimpleAccordion title="Account Manager">
            <div className="category-manager-list">
                {settings.accounts.map(account => (
                    <div key={account.id} className="category-manager-item">
                        <input type="text" defaultValue={account.name} onBlur={(e) => handleUpdateAccount(account.id, e.target.value)} />
                        <button className={`remove-link-btn ${confirmingDeleteId === account.id ? 'confirm-delete' : ''}`} onClick={() => handleDeleteAccount(account.id)}>
                            <i className={`fas ${confirmingDeleteId === account.id ? 'fa-check' : 'fa-minus'}`}></i>
                        </button>
                    </div>
                ))}
            </div>
            <button className="add-link-btn" onClick={handleAddAccount}><i className="fas fa-plus"></i> Add Account</button>
        </SimpleAccordion>
    );
}