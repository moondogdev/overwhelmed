import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Settings, TaskType, AccordionProps, Account, TaxCategory } from '../types';
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

export function TaxCategoryManager() {
    const { settings, setSettings, focusTaxBulkAdd, setFocusTaxBulkAdd, handleAutoTaxCategorize, handleAutoTagIncomeTypes, handleBulkSetIncomeType, filteredTasks } = useAppContext();
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
    const [bulkKeywordsText, setBulkKeywordsText] = useState('');
    const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const bulkKeywordsTextareaRef = useRef<HTMLTextAreaElement>(null);
    const id = -4; // A unique negative ID for this accordion
    const isOpen = (settings.openAccordionIds || []).includes(id);

    useEffect(() => {
        if (focusTaxBulkAdd && isOpen) {
            setTimeout(() => {
                bulkKeywordsTextareaRef.current?.focus();
                bulkKeywordsTextareaRef.current?.select();
                setFocusTaxBulkAdd(false); // Reset the flag
            }, 100); // A small delay ensures the accordion is fully open
        }
    }, [focusTaxBulkAdd, isOpen, setFocusTaxBulkAdd]);

    const autoTaxCategorizeCounts = useMemo(() => {
        if (!settings.taxCategories || settings.taxCategories.length === 0) return {};

        const counts: { [key: string]: number } = {};
        const taggableIds = new Set<number>();

        for (const taxCat of settings.taxCategories) {
            counts[taxCat.id] = 0;
            for (const task of filteredTasks) {
                // A task is a candidate if it doesn't have a tax category yet
                // AND its text matches a keyword.
                if (!task.taxCategoryId && (taxCat.keywords || []).some(kw => task.text.toLowerCase().includes(kw.toLowerCase().trim()))) {
                    counts[taxCat.id]++;
                    if (!taggableIds.has(task.id)) {
                        taggableIds.add(task.id);
                    }
                }
            }
        }
        counts['all'] = taggableIds.size;
        return counts;
    }, [filteredTasks, settings.taxCategories]);

    const incomeAutoTagCounts = useMemo(() => {
        const incomeKeywords = settings.incomeTypeKeywords;
        if (!incomeKeywords) return { w2: 0, business: 0, reimbursement: 0, all: 0 };

        const counts = { w2: 0, business: 0, reimbursement: 0 };
        const taggableIds = new Set<number>();

        for (const task of filteredTasks) {
            if ((task.transactionAmount || 0) > 0 && !task.incomeType) {
                const taskText = task.text.toLowerCase();
                for (const type of ['w2', 'business', 'reimbursement'] as const) {
                    if ((incomeKeywords[type] || []).some(kw => taskText.includes(kw.toLowerCase().trim()))) {
                        counts[type]++;
                        taggableIds.add(task.id);
                    }
                }
            }
        }
        return { ...counts, all: taggableIds.size };
    }, [filteredTasks, settings.incomeTypeKeywords]);

    const handleToggle = (newIsOpen: boolean) => {
        setSettings(prev => {
            const currentOpenIds = prev.openAccordionIds || [];
            const newOpenIds = newIsOpen
                ? [...currentOpenIds, id]
                : currentOpenIds.filter(i => i !== id);
            return { ...prev, openAccordionIds: newOpenIds };
        });
    };

    const handleAddTaxCategory = () => {
        const newCategory: TaxCategory = { id: Date.now(), name: 'New Tax Category', keywords: [] };
        setSettings(prev => ({ ...prev, taxCategories: [...(prev.taxCategories || []), newCategory] }));
    };

    const handleUpdateTaxCategory = (id: number, updates: Partial<TaxCategory>) => {
        setSettings(prev => ({
            ...prev,
            taxCategories: (prev.taxCategories || []).map(cat => cat.id === id ? { ...cat, ...updates } : cat)
        }));
    };

    const handleDeleteTaxCategory = (id: number) => {
        if (confirmingDeleteId === id) {
            setSettings(prev => ({ ...prev, taxCategories: (prev.taxCategories || []).filter(cat => cat.id !== id) }));
            // Note: We'll need a handler in useTaskState to nullify taxCategoryId on associated tasks later.
            setConfirmingDeleteId(null);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        } else {
            setConfirmingDeleteId(id);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteId(null), 3000);
        }
    };

    const moveTaxCategory = (categoryId: number, direction: 'up' | 'down') => {
        const categories = settings.taxCategories || [];
        const index = categories.findIndex(c => c.id === categoryId);
        if (index === -1) return categories;

        const newCategories = [...categories];
        const item = newCategories.splice(index, 1)[0];

        if (direction === 'up' && index > 0) {
            newCategories.splice(index - 1, 0, item);
        } else if (direction === 'down' && index < categories.length - 1) {
            newCategories.splice(index + 1, 0, item);
        } else {
            // If it can't move, put it back where it was
            newCategories.splice(index, 0, item);
        }
        setSettings(prev => ({ ...prev, taxCategories: newCategories }));
    };

    const handleBulkAddKeywords = () => {
        if (!bulkKeywordsText.trim()) return;

        const lines = bulkKeywordsText.trim().split('\n');
        let updatedCategories = [...(settings.taxCategories || [])];

        lines.forEach(line => {
            const parts = line.split(':');
            if (parts.length < 2) return;

            const categoryName = parts[0].trim();
            const keywords = parts.slice(1).join(':').split(',').map(k => k.trim()).filter(Boolean);

            const existingCategory = updatedCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());

            if (existingCategory) {
                const newKeywords = Array.from(new Set([...(existingCategory.keywords || []), ...keywords]));
                updatedCategories = updatedCategories.map(c => c.id === existingCategory.id ? { ...c, keywords: newKeywords } : c);
            } else {
                // If it doesn't exist, create it.
                const newCategory: TaxCategory = { id: Date.now() + Math.random(), name: categoryName, keywords: keywords };
                updatedCategories.push(newCategory);
            }
        });
        setSettings(prev => ({ ...prev, taxCategories: updatedCategories }));
        setBulkKeywordsText('');
    };

    return (
        <SimpleAccordion title="Tax Category Manager" startOpen={isOpen} onToggle={handleToggle}>
            <div className="category-manager-list">
                {(settings.taxCategories || []).map(category => (
                    <div key={category.id} className="category-manager-group">
                        <div className="category-manager-item sub">
                            <input type="text" defaultValue={category.name} onBlur={(e) => handleUpdateTaxCategory(category.id, { name: e.target.value })} />
                            <button className="icon-button" onClick={() => moveTaxCategory(category.id, 'up')} title="Move Up"><i className="fas fa-arrow-up"></i></button>
                            <button className="icon-button" onClick={() => moveTaxCategory(category.id, 'down')} title="Move Down"><i className="fas fa-arrow-down"></i></button>
                            <button className={`remove-link-btn ${confirmingDeleteId === category.id ? 'confirm-delete' : ''}`} onClick={() => handleDeleteTaxCategory(category.id)}>
                                <i className={`fas ${confirmingDeleteId === category.id ? 'fa-check' : 'fa-minus'}`}></i>
                            </button>
                        </div>
                        <div className="category-manager-item sub keywords">
                            <input type="text" placeholder="Auto-tagging keywords (comma-separated)..." defaultValue={(category.keywords || []).join(', ')} onBlur={(e) => handleUpdateTaxCategory(category.id, { keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })} />
                        </div>
                    </div>
                ))}
            </div>
            <button className="add-link-btn" onClick={handleAddTaxCategory}><i className="fas fa-plus"></i> Add Tax Category</button>
            <div className="bulk-add-container" style={{ marginTop: '15px' }}>
                <textarea
                    ref={bulkKeywordsTextareaRef}
                    value={bulkKeywordsText}
                    onChange={(e) => setBulkKeywordsText(e.target.value)}
                    placeholder="Bulk add keywords (e.g., Office Supplies: staples, paper)"
                    rows={4}
                />
                <button onClick={handleBulkAddKeywords}>
                    <i className="fas fa-plus-square"></i> Bulk Add Keywords
                </button>
                <button onClick={() => {
                    const textToCopy = (settings.taxCategories || [])
                        .map(cat => `${cat.name}: ${(cat.keywords || []).join(', ')}`)
                        .join('\n');
                    navigator.clipboard.writeText(textToCopy);
                    // We don't have showToast here, but this is fine for now.
                }}>
                    <i className="fas fa-copy"></i> Copy All Keywords
                </button>
            </div>
            <hr style={{ margin: '20px 0' }} />
            <h4>Auto-Tag Actions</h4>
            <div className="category-manager-group">
                <p style={{ fontSize: '12px', margin: '0 0 10px 0', color: '#888' }}>
                    Run auto-tagging rules on all currently visible tasks in the list view.
                </p>
                {(autoTaxCategorizeCounts['all'] || 0) > 0 ? (
                    <>
                        <div className="list-auto-cat-btn-container">
                            {settings.taxCategories
                                .filter(taxCat => (autoTaxCategorizeCounts[taxCat.id] || 0) > 0)
                                .map(taxCat => (
                                    <button key={taxCat.id} onClick={() => handleAutoTaxCategorize(filteredTasks.map(t => t.id), taxCat.id)} title={`Tag based on "${taxCat.name}" keywords`}>
                                        {taxCat.name} ({autoTaxCategorizeCounts[taxCat.id] || 0})
                                    </button>
                                ))
                            }
                        </div>
                        <div className="list-auto-cat-all-container" style={{ marginTop: '10px' }}>
                            <button onClick={() => handleAutoTaxCategorize(filteredTasks.map(t => t.id))} title="Run all tax auto-tagging rules on visible items">
                                <i className="fas fa-tags"></i> Auto-Tag All ({autoTaxCategorizeCounts['all'] || 0})
                            </button>
                        </div>
                    </>
                ) : (<p style={{ fontSize: '12px', margin: '0', color: '#888' }}>No keyword matches found for untagged items in the current view.</p>)}
            </div>
            <hr style={{ margin: '20px 0' }} />
            <h4>Income Type Keywords</h4>
            <div className="category-manager-group">
                <label>W-2 Wages</label>
                <div className="category-manager-item sub keywords">
                    <input
                        type="text"
                        placeholder="Keywords (e.g., paycheck, direct deposit)"
                        defaultValue={(settings.incomeTypeKeywords?.w2 || []).join(', ')}
                        onBlur={(e) => {
                            const keywords = e.target.value.split(',').map(k => k.trim()).filter(Boolean);
                            setSettings(prev => ({ ...prev, incomeTypeKeywords: { ...(prev.incomeTypeKeywords || { w2: [], business: [], reimbursement: [] }), w2: keywords } }));
                        }}
                    />
                </div>
            </div>
            <div className="category-manager-group">
                <label>Business Earnings</label>
                <div className="category-manager-item sub keywords">
                    <input
                        type="text"
                        placeholder="Keywords (e.g., client payment, invoice)"
                        defaultValue={(settings.incomeTypeKeywords?.business || []).join(', ')}
                        onBlur={(e) => {
                            const keywords = e.target.value.split(',').map(k => k.trim()).filter(Boolean);
                            setSettings(prev => ({ ...prev, incomeTypeKeywords: { ...(prev.incomeTypeKeywords || { w2: [], business: [], reimbursement: [] }), business: keywords } }));
                        }}
                    />
                </div>
            </div>
            <div className="category-manager-group">
                <label>Reimbursements</label>
                <div className="category-manager-item sub keywords">
                    <input
                        type="text"
                        placeholder="Keywords (e.g., venmo, zelle, payback)"
                        defaultValue={(settings.incomeTypeKeywords?.reimbursement || []).join(', ')}
                        onBlur={(e) => {
                            const keywords = e.target.value.split(',').map(k => k.trim()).filter(Boolean);
                            setSettings(prev => ({ ...prev, incomeTypeKeywords: { ...(prev.incomeTypeKeywords || { w2: [], business: [], reimbursement: [] }), reimbursement: keywords } }));
                        }}
                    />
                </div>
            </div>
            <hr style={{ margin: '20px 0' }} />
            <h4>Income Auto-Tag Actions</h4>
            <div className="category-manager-group">
                <p style={{ fontSize: '12px', margin: '0 0 10px 0', color: '#888' }}>
                    Run income tagging rules on all currently visible tasks in the list view.
                </p>
                {(incomeAutoTagCounts.all || 0) > 0 || filteredTasks.some(t => t.incomeType) ? (
                    <>
                        <div className="list-auto-cat-btn-container">
                            {Object.entries(incomeAutoTagCounts).filter(([key, value]) => key !== 'all' && value > 0).map(([key, value]) => (
                                <button key={key} onClick={() => handleAutoTagIncomeTypes(filteredTasks.map(t => t.id), key as any)} title={`Tag items matching '${key}' keywords`}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)} ({value})
                                </button>
                            ))}
                        </div>
                        <div className="list-auto-cat-all-container" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleAutoTagIncomeTypes(filteredTasks.map(t => t.id))} title="Run all income auto-tagging rules">
                                <i className="fas fa-dollar-sign"></i> Auto-Tag All ({incomeAutoTagCounts.all || 0})
                            </button>
                            {filteredTasks.some(t => t.incomeType) && (
                                <button
                                    className="uncategorize-all-btn"
                                    onClick={() => handleBulkSetIncomeType(filteredTasks.map(t => t.id), undefined)}
                                    title="Remove income type from all visible items"
                                    style={{ margin: 0 }}
                                >
                                    <i className="fas fa-times-circle"></i> Uncategorize All
                                </button>
                            )}
                        </div>
                    </>
                ) : (<p style={{ fontSize: '12px', margin: '0', color: '#888' }}>No income keyword matches found for untagged items in the current view.</p>)}
            </div>
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