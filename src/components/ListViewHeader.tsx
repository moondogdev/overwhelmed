import React from 'react';
import { Task, Settings, Category } from '../types';
import { getContrastColor } from '../utils';
import { useAppContext } from '../contexts/AppContext';

interface ListViewHeaderProps {
    isTransactionsView: boolean;
    nonTransactionTasksCount: number;
    handleSortPillClick: (key: string, direction: 'asc' | 'desc') => void;
    autoCategorizeCounts: { [key: string]: number };
    filteredTasks: Task[];
    uncategorizeTaxCount: number;
    autoTaxCategorizeCounts: { [key: string]: number };
    uncategorizeIncomeCount: number;
    transactionYears: number[];
    tasksBeforeTaxFilter: Task[];
    tasksForAccountCounting: Task[];
}

export const ListViewHeader: React.FC<ListViewHeaderProps> = ({
    isTransactionsView, nonTransactionTasksCount, handleSortPillClick, autoCategorizeCounts,
    filteredTasks, uncategorizeTaxCount, autoTaxCategorizeCounts, uncategorizeIncomeCount,
    transactionYears, tasksBeforeTaxFilter, tasksForAccountCounting
}) => {
    const {
        tasks, settings, setSettings, searchQuery, setSearchQuery, searchInputRef, sortSelectRef,
        setActiveCategoryId, setActiveSubCategoryId, setActiveTaxCategoryId, handleAutoCategorize,
        handleBulkSetTaxCategory, handleAutoTaxCategorize, setFocusTaxBulkAdd, handleBulkSetIncomeType,
        handleAutoTagIncomeTypes, taxStatusFilter, setTaxStatusFilter, navigateToView
    } = useAppContext();

    const { activeCategoryId, activeSubCategoryId, selectedReportYear, activeAccountId, activeTransactionTypeFilter, incomeTypeFilter, activeTaxCategoryId } = settings;
    const parentCategories = settings.categories.filter(c => !c.parentId);
    const subCategoriesForActive = activeCategoryId !== 'all' ? settings.categories.filter(c => c.parentId === activeCategoryId) : [];

    return (
        <>
            {!isTransactionsView && (
                <div className="category-tabs">
                    <button onClick={() => { setActiveCategoryId('all'); setActiveSubCategoryId('all'); setSearchQuery(''); setSettings(prev => ({ ...prev, selectedReportYear: null, activeAccountId: 'all', activeTransactionTypeFilter: 'all' })); setActiveTaxCategoryId('all'); }}
                        className={`all-category-btn ${activeCategoryId === 'all' ? 'active' : ''}`}
                        style={{
                            backgroundColor: settings.allCategoryColor || '#4a4f5b',
                            color: getContrastColor(settings.allCategoryColor || '#4a4f5b')
                        }}
                    >
                        All ({nonTransactionTasksCount})
                    </button>
                    {parentCategories
                        .filter(cat => cat.name !== 'Transactions')
                        .map((cat: Category) => {
                            const subCatIds = settings.categories.filter(sc => sc.parentId === cat.id).map(sc => sc.id);
                            const count = tasks.filter(t => t.categoryId === cat.id || (t.categoryId && subCatIds.includes(t.categoryId))).length;
                            return (
                                <button
                                    key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setActiveSubCategoryId('all'); setSearchQuery(''); setSettings(prev => ({ ...prev, selectedReportYear: null, activeAccountId: 'all', activeTransactionTypeFilter: 'all' })); setActiveTaxCategoryId('all'); }}
                                    className={activeCategoryId === cat.id ? 'active' : ''}
                                    style={{
                                        backgroundColor: cat.color || 'transparent',
                                        color: getContrastColor(cat.color || '#282c34')
                                    }}>
                                    {cat.name} ({count})
                                </button>
                            );
                        })}
                </div>
            )}
            {subCategoriesForActive.length > 0 && (
                <div className="sub-category-tabs">
                    {(() => {
                        const parentCategory = settings.categories.find(c => c.id === activeCategoryId);
                        const subCatIds = settings.categories.filter(sc => sc.parentId === parentCategory?.id).map(sc => sc.id);
                        const totalCount = tasks.filter(t => t.categoryId === parentCategory?.id || (t.categoryId && subCatIds.includes(t.categoryId))).length;
                        return (
                            <button onClick={() => { setActiveSubCategoryId('all'); setSearchQuery(''); setSettings(prev => ({ ...prev, selectedReportYear: null, activeAccountId: 'all', activeTransactionTypeFilter: 'all' })); setActiveTaxCategoryId('all'); }}
                                className={`all-category-btn ${activeSubCategoryId === 'all' ? 'active' : ''}`}
                                style={{
                                    backgroundColor: parentCategory?.color || '#3a3f4b',
                                    color: getContrastColor(parentCategory?.color || '#3a3f4b')
                                }}
                            >All ({totalCount})</button>
                        );
                    })()}
                    {subCategoriesForActive.map(subCat => {
                        const count = tasks.filter(t => t.categoryId === subCat.id).length;
                        if (isTransactionsView && count === 0) return null;
                        return (
                            <button key={subCat.id} onClick={() => { setActiveSubCategoryId(subCat.id); setSearchQuery(''); setSettings(prev => ({ ...prev, selectedReportYear: null, activeAccountId: 'all', activeTransactionTypeFilter: 'all' })); setActiveTaxCategoryId('all'); }} className={activeSubCategoryId === subCat.id ? 'active' : ''} style={{
                                backgroundColor: subCat.color || '#3a3f4b',
                                color: getContrastColor(subCat.color || '#3a3f4b')
                            }}>
                                {subCat.name} ({count})
                            </button>
                        );
                    })}
                </div>
            )}
            <div className="list-view-controls">
                <div className="list-header-search" style={{ width: '100%' }}>
                    <input ref={searchInputRef} type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') { setSearchQuery(''); } }} />
                    <button className="clear-search-btn" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }} title="Clear Search"><i className="fas fa-times"></i></button>
                </div>
                <div className="list-header-sort">
                    <label>Sort by:
                        <select ref={sortSelectRef}
                            onChange={(e) => {
                                const value = e.target.value;
                                const newSortConfig = { ...settings.prioritySortConfig };
                                if (value === 'none') { newSortConfig[String(activeCategoryId)] = null; } else { const [key, direction] = value.split('-'); newSortConfig[String(activeCategoryId)] = { key: key as any, direction: direction as any }; }
                                setSettings(prev => ({ ...prev, prioritySortConfig: newSortConfig }));
                            }}
                            value={settings.prioritySortConfig?.[String(activeCategoryId)] ? `${settings.prioritySortConfig[String(activeCategoryId)].key}-${settings.prioritySortConfig[String(activeCategoryId)].direction}` : 'none'}
                        >
                            <option value="none">Default (Manual)</option>
                            <option value="completeBy-asc">Due Date (Soonest First)</option>
                            <option value="text-asc">Task Name (A-Z)</option>
                            <option value="text-desc">Task Name (Z-A)</option>
                            <option value="priority-asc">Priority (High to Low)</option>
                            <option value="openDate-desc">Open Date (Newest First)</option>
                            <option value="openDate-asc">Open Date (Oldest First)</option>
                            <option value="timeOpen-desc">Time Open (Longest First)</option>
                            <option value="price-desc">Price (Highest First)</option>
                            <option value="price-asc">Price (Lowest First)</option>
                        </select>
                    </label>
                </div>
                <div className="list-header-sort-pills">
                    {settings.prioritySortConfig?.[String(activeCategoryId)] && (<button className="clear-sort-btn" onClick={() => { setSettings(prev => ({ ...prev, prioritySortConfig: { ...prev.prioritySortConfig, [String(activeCategoryId)]: null } })); if (sortSelectRef.current) sortSelectRef.current.value = 'none'; }} title="Clear Sort"><i className="fas fa-times"></i></button>)}
                    {(() => {
                        const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
                        if (activeCategory?.name === 'Transactions') {
                            const currentSort = settings.prioritySortConfig?.[String(activeCategoryId)];
                            const isActive = (key: keyof Task | 'price', dir: string) => currentSort?.key === key && currentSort?.direction === dir;
                            return (<><span className="list-filter-title">Quick Sort:</span><button className={isActive('price', 'desc') ? 'active' : ''} onClick={() => handleSortPillClick('price', 'desc')}>Price (Highest)</button><button className={isActive('price', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('price', 'asc')}>Price (Lowest)</button><button className={isActive('openDate', 'desc') ? 'active' : ''} onClick={() => handleSortPillClick('openDate', 'desc')}>Date (Newest)</button><button className={isActive('openDate', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('openDate', 'asc')}>Date (Oldest)</button><button className={isActive('text', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('text', 'asc')}>Name (A-Z)</button><button className={isActive('text', 'desc') ? 'active' : ''} onClick={() => handleSortPillClick('text', 'desc')}>Name (Z-A)</button></>);
                        } else {
                            const currentSort = settings.prioritySortConfig?.[String(activeCategoryId)];
                            const isActive = (key: keyof Task | 'timeOpen', dir: string) => currentSort?.key === key && currentSort?.direction === dir;
                            return (<><span className="list-filter-title">Quick Sort:</span><button className={isActive('completeBy', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('completeBy', 'asc')}>Due Date</button><button className={isActive('priority', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('priority', 'asc')}>Priority</button><button className={isActive('openDate', 'desc') ? 'active' : ''} onClick={() => handleSortPillClick('openDate', 'desc')}>Newest</button><button className={isActive('text', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('text', 'asc')}>Name (A-Z)</button></>);
                        }
                    })()}
                </div>
                {isTransactionsView && (<div className="list-header-year-filter filter-group-auto-categorize">{(autoCategorizeCounts['all'] || 0) > 0 && (<><div className="list-filter-title-container"><span className="list-filter-title">Auto-Categorize:</span><button className="icon-button" onClick={() => { const autoCategorizeAccordionId = -3; setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, autoCategorizeAccordionId])] })); }} title="Open Transaction Autocategorize Settings"><i className="fas fa-cog"></i></button></div><div className="list-auto-cat-btn-container">{settings.categories.filter(c => c.parentId === settings.categories.find(p => p.name === 'Transactions')?.id && (autoCategorizeCounts[c.id] || 0) > 0).map(subCat => (<button key={subCat.id} onClick={() => handleAutoCategorize(filteredTasks.map(t => t.id), subCat.id)} title={`Categorize based on "${subCat.name}" keywords`}>{subCat.name} ({autoCategorizeCounts[subCat.id] || 0})</button>))}</div><div className="list-auto-cat-all-container"><button onClick={() => handleAutoCategorize(filteredTasks.map(t => t.id))} title="Run all auto-categorization rules"><i className="fas fa-magic"></i> Auto-Categorize All ({autoCategorizeCounts['all'] || 0})</button></div></>)}{(autoCategorizeCounts['all'] || 0) === 0 && (<div className="auto-cat-zero-state"><span>All visible transactions are categorized.</span><button onClick={() => setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, -3])] }))}>Add Keywords</button></div>)}</div>)}
                {isTransactionsView && settings.taxCategories && settings.taxCategories.length > 0 && (<div className="list-header-year-filter filter-group-auto-categorize tax-cat"><div className="list-filter-title-container"><span className="list-filter-title">Auto-Tag for Taxes:</span><button className="icon-button" onClick={() => { const taxManagerAccordionId = -4; setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, taxManagerAccordionId])] })); }} title="Open Tax Category Manager"><i className="fas fa-cog"></i></button>{uncategorizeTaxCount > 0 && (<button className="uncategorize-all-btn" onClick={() => { handleBulkSetTaxCategory(filteredTasks.map(t => t.id), undefined); if (activeTaxCategoryId !== 'all') { setActiveTaxCategoryId('all'); } }} title="Remove tax category from all visible items"><i className="fas fa-times-circle"></i> Uncategorize All ({uncategorizeTaxCount})</button>)}</div>{(autoTaxCategorizeCounts['all'] || 0) > 0 ? (<><div className="list-auto-cat-btn-container">{settings.taxCategories.filter(taxCat => (autoTaxCategorizeCounts[taxCat.id] || 0) > 0).map(taxCat => (<button key={taxCat.id} onClick={() => handleAutoTaxCategorize(filteredTasks.map(t => t.id), taxCat.id)} title={`Tag based on "${taxCat.name}" keywords`}>{taxCat.name} ({autoTaxCategorizeCounts[taxCat.id] || 0})</button>))}</div><div className="list-auto-cat-all-container"><button onClick={() => handleAutoTaxCategorize(filteredTasks.map(t => t.id))} title="Run all tax auto-tagging rules on visible items"><i className="fas fa-tags"></i> Auto-Tag All ({autoTaxCategorizeCounts['all'] || 0})</button></div></>) : (filteredTasks.some(t => !t.taxCategoryId) ? (<div className="auto-cat-zero-state"><span>No keyword matches found for untagged items.</span><button onClick={() => { setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, -4])] })); setFocusTaxBulkAdd(true); }}>Add Keywords</button></div>) : (<div className="auto-cat-zero-state"><span>All visible transactions are tax-tagged.</span></div>))}</div>)}
                {isTransactionsView && settings.incomeTypeKeywords && (<div className="list-header-year-filter filter-group-auto-categorize income-cat"><div className="list-filter-title-container"><span className="list-filter-title">Auto-Tag Income:</span><button className="icon-button" onClick={() => { const taxManagerAccordionId = -4; setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, taxManagerAccordionId])] })); }} title="Open Income Keyword Settings"><i className="fas fa-cog"></i></button>{uncategorizeIncomeCount > 0 && (<button className="uncategorize-all-btn" onClick={() => handleBulkSetIncomeType(filteredTasks.map(t => t.id), undefined)} title="Remove income type from all visible items"><i className="fas fa-times-circle"></i> Uncategorize All ({uncategorizeIncomeCount})</button>)}</div><div className="list-auto-cat-btn-container">{(settings.incomeTypeKeywords.w2 || []).length > 0 && (<button onClick={() => handleAutoTagIncomeTypes(filteredTasks.map(t => t.id), 'w2')} title="Tag items matching 'W-2' keywords">W-2 Wages</button>)}{(settings.incomeTypeKeywords.business || []).length > 0 && (<button onClick={() => handleAutoTagIncomeTypes(filteredTasks.map(t => t.id), 'business')} title="Tag items matching 'Business' keywords">Business</button>)}{(settings.incomeTypeKeywords.reimbursement || []).length > 0 && (<button onClick={() => handleAutoTagIncomeTypes(filteredTasks.map(t => t.id), 'reimbursement')} title="Tag items matching 'Reimbursement' keywords">Reimbursement</button>)}</div><div className="list-auto-cat-all-container"><button onClick={() => handleAutoTagIncomeTypes(filteredTasks.map(t => t.id))} title="Run all income auto-tagging rules"><i className="fas fa-dollar-sign"></i> Auto-Tag All Income</button></div></div>)}                
                {isTransactionsView && transactionYears.length > 1 && (<div className="list-header-year-filter filter-group-year"><span className="list-filter-title">Filter by Year:</span><button className={selectedReportYear === null ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, selectedReportYear: null }))}>All Years</button>{transactionYears.map(year => (<button key={year} className={selectedReportYear === year ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, selectedReportYear: year }))}>{year}</button>))}</div>)}
                {isTransactionsView && settings.taxCategories && settings.taxCategories.length > 0 && (<div className="category-tabs tax-category-tabs"><button className={activeTaxCategoryId === 'all' ? 'active' : ''} onClick={() => setActiveTaxCategoryId('all')}>All Tax Categories</button>{settings.taxCategories.map(taxCat => { const count = tasksBeforeTaxFilter.filter(t => t.taxCategoryId === taxCat.id).length; if (count === 0) return null; return (<button key={taxCat.id} className={activeTaxCategoryId === taxCat.id ? 'active' : ''} onClick={() => setActiveTaxCategoryId(taxCat.id)}>{taxCat.name} ({count})</button>); })}</div>)}
                {isTransactionsView && settings.accounts.length > 0 && (<div className="list-header-year-filter filter-group-account"><span className="list-filter-title">Filter by Account:</span><button className={activeAccountId === 'all' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeAccountId: 'all' }))}>All Accounts ({tasksForAccountCounting.length})</button>{settings.accounts.map(account => { const count = tasksForAccountCounting.filter(t => t.accountId === account.id).length; if (count === 0) return null; return (<button key={account.id} className={activeAccountId === account.id ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeAccountId: account.id }))}>{account.name} ({count})</button>); })}</div>)}
                {isTransactionsView && (<div className="list-header-year-filter filter-group-transaction-type"><span className="list-filter-title">Filter by Type:</span><button className={activeTransactionTypeFilter === 'all' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeTransactionTypeFilter: 'all' }))}>All Types ({tasksForAccountCounting.filter(t => activeAccountId === 'all' || t.accountId === activeAccountId).length})</button>{(() => { const incomeCount = tasksForAccountCounting.filter(t => t.transactionType === 'income' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length; if (incomeCount > 0) { return <button className={activeTransactionTypeFilter === 'income' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeTransactionTypeFilter: 'income' }))}>Income ({incomeCount})</button>; } return null; })()}{(() => { const expenseCount = tasksForAccountCounting.filter(t => t.transactionType === 'expense' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length; if (expenseCount > 0) { return <button className={activeTransactionTypeFilter === 'expense' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeTransactionTypeFilter: 'expense' }))}>Expense ({expenseCount})</button>; } return null; })()}{(() => { const transferCount = tasksForAccountCounting.filter(t => t.transactionType === 'transfer' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length; if (transferCount > 0) { return <button className={activeTransactionTypeFilter === 'transfer' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeTransactionTypeFilter: 'transfer' }))}>Transfers ({transferCount})</button>; } return null; })()}</div>)}
                {isTransactionsView && (<div className="list-header-year-filter filter-group-tax-status"><span className="list-filter-title">Tax Status:</span><button className={taxStatusFilter === 'all' ? 'active' : ''} onClick={() => setTaxStatusFilter('all')}>All</button><button className={taxStatusFilter === 'tagged' ? 'active' : ''} onClick={() => setTaxStatusFilter('tagged')}>Tagged</button><button className={taxStatusFilter === 'untagged' ? 'active' : ''} onClick={() => setTaxStatusFilter('untagged')}>Untagged</button></div>)}
                {isTransactionsView && activeTransactionTypeFilter === 'income' && (<div className="list-header-year-filter filter-group-income-type"><span className="list-filter-title">Filter by Income Tag:</span><button className={incomeTypeFilter === 'all' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, incomeTypeFilter: 'all' }))}>All</button><button className={incomeTypeFilter === 'w2' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, incomeTypeFilter: 'w2' }))}>W-2</button><button className={incomeTypeFilter === 'business' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, incomeTypeFilter: 'business' }))}>Business</button><button className={incomeTypeFilter === 'reimbursement' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, incomeTypeFilter: 'reimbursement' }))}>Reimbursement</button><button className={incomeTypeFilter === 'untagged' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, incomeTypeFilter: 'untagged' }))}>Untagged</button></div>)}
            </div>
            {isTransactionsView && (
                <div className="list-view-report-shortcuts">
                    <button onClick={() => navigateToView('reports', { initialTab: 'finances' })}>
                        <i className="fas fa-chart-pie"></i> Go to Finances Report
                    </button>
                    <button onClick={() => navigateToView('reports', { initialTab: 'taxes' })}>
                        <i className="fas fa-file-invoice-dollar"></i> Go to Taxes Report
                    </button>
                </div>
            )}
        </>
    );
};