import React from 'react';
import { Category, Account, Task } from '../../types';

interface ReportFiltersProps {
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    onExportCsv: () => void;
    exportDisabled?: boolean;
    categories: Category[];
    activeCategoryId: number | 'all';
    setActiveCategoryId: (id: number | 'all') => void;
    activeSubCategoryId: number | 'all';
    activeTransactionTypeFilter: 'all' | 'income' | 'expense' | 'transfer';
    setActiveTransactionTypeFilter: (type: 'all' | 'income' | 'expense' | 'transfer') => void;
    tasksForCounting: Task[];
    activeTab: string;
    accounts: Account[];
    activeAccountId: number | 'all';
    setActiveAccountId: (id: number | 'all') => void;
    activeTaxCategoryId: number | 'all';
    setActiveTaxCategoryId: (id: number | 'all') => void;
    setActiveSubCategoryId: (id: number | 'all') => void;
    dateFilteredTasks: Task[];
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
    startDate, setStartDate, endDate, setEndDate, onExportCsv, exportDisabled = false, categories, activeCategoryId, setActiveCategoryId, activeSubCategoryId, activeTab, accounts, activeAccountId, setActiveAccountId, activeTransactionTypeFilter, setActiveTransactionTypeFilter, tasksForCounting, setActiveSubCategoryId, dateFilteredTasks, activeTaxCategoryId, setActiveTaxCategoryId
}) => {
    const parentCategories = categories.filter(c => !c.parentId);
    const subCategoriesForActive = activeCategoryId !== 'all' ? categories.filter(c => c.parentId === activeCategoryId) : [];

    return (
        <>
            <div className="report-filters">
                <label>
                    Start Date:
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>
                <label>
                    End Date:
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </label>
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="clear-filter-btn">
                    Clear Filter
                </button>
                <button onClick={onExportCsv} className="export-csv-btn" disabled={exportDisabled}>
                    Export to CSV
                </button>
            </div>
            {activeTab !== 'finances' && activeTab !== 'taxes' ? (
                <div className="category-tabs">
                    <button onClick={() => { setActiveCategoryId('all'); setActiveSubCategoryId('all'); }} className={activeCategoryId === 'all' ? 'active' : ''}>
                        All ({dateFilteredTasks.length})
                    </button>
                    {parentCategories.map((cat: Category) => {
                        const subCatIds = categories.filter(sc => sc.parentId === cat.id).map(sc => sc.id);
                        const count = dateFilteredTasks.filter(t => t.categoryId === cat.id || (t.categoryId && subCatIds.includes(t.categoryId))).length;
                        return (
                            <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setActiveSubCategoryId('all'); }} className={activeCategoryId === cat.id ? 'active' : ''}>
                                {cat.name} ({count})
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="report-filter-title-container">
                    <h4 className="report-filter-title">Filter by Category:</h4>
                </div>
            )}
            {subCategoriesForActive.length > 0 && (
                <div className="sub-category-tabs">
                    {(() => {
                        const parentCategory = categories.find(c => c.id === activeCategoryId);
                        const subCatIds = categories.filter(sc => sc.parentId === parentCategory?.id).map(sc => sc.id);
                        const totalCount = dateFilteredTasks.filter(t => t.categoryId === parentCategory?.id || (t.categoryId && subCatIds.includes(t.categoryId))).length;
                        return (
                            <button onClick={() => setActiveSubCategoryId('all')} className={activeSubCategoryId === 'all' ? 'active' : ''}>All ({totalCount})</button>
                        );
                    })()}
                    {subCategoriesForActive.map(subCat => {
                        const count = dateFilteredTasks.filter(t => t.categoryId === subCat.id).length;
                        if (activeTab === 'finances' && count === 0) {
                            return null;
                        }
                        return (
                            <button key={subCat.id} onClick={() => setActiveSubCategoryId(subCat.id)} className={activeSubCategoryId === subCat.id ? 'active' : ''}>
                                {subCat.name} ({count})
                            </button>
                        );
                    })}
                </div>
            )}
            {(activeTab === 'finances' || activeTab === 'taxes') && accounts.length > 0 && (
                <div className="category-tabs">
                    <button onClick={() => setActiveAccountId('all')} className={activeAccountId === 'all' ? 'active' : ''}>
                        All Accounts ({tasksForCounting.filter(t => t.transactionAmount && (activeTab === 'taxes' ? t.transactionAmount < 0 : true)).length})
                    </button>
                    {accounts.map(account => {
                        const count = tasksForCounting.filter(t => t.accountId === account.id && (activeTab === 'taxes' ? t.transactionAmount < 0 : true)).length;
                        return (<button key={account.id} onClick={() => setActiveAccountId(account.id)} className={activeAccountId === account.id ? 'active' : ''}>{account.name} ({count})</button>);
                    })}
                </div>
            )}
            {(activeTab === 'finances' || activeTab === 'taxes') && (
                <div className="report-filter-group filter-group-transaction-type" style={{ border: '0px solid var(--border-color)' }}>
                    <div className="category-tabs">
                        <button onClick={() => setActiveTransactionTypeFilter('all')} className={activeTransactionTypeFilter === 'all' ? 'active' : ''}>All ({tasksForCounting.filter(t => t.transactionAmount && (activeAccountId === 'all' || t.accountId === activeAccountId)).length})</button>
                        <button onClick={() => setActiveTransactionTypeFilter('income')} className={activeTransactionTypeFilter === 'income' ? 'active' : ''}>Income ({tasksForCounting.filter(t => t.transactionType === 'income' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length})</button>
                        <button onClick={() => setActiveTransactionTypeFilter('expense')} className={activeTransactionTypeFilter === 'expense' ? 'active' : ''}>Expense ({tasksForCounting.filter(t => t.transactionType === 'expense' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length})</button>
                        <button onClick={() => setActiveTransactionTypeFilter('transfer')} className={activeTransactionTypeFilter === 'transfer' ? 'active' : ''}>Transfers ({tasksForCounting.filter(t => t.transactionType === 'transfer' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length})</button>
                    </div>
                </div>
            )}
            {activeTab === 'taxes' && categories.length > 0 && (
                <div className="category-tabs tax-category-tabs">
                    <button onClick={() => setActiveTaxCategoryId('all')} className={activeTaxCategoryId === 'all' ? 'active' : ''}>All Tax Categories</button>
                    {categories.map(taxCat => {
                        const count = tasksForCounting.filter(t => t.taxCategoryId === taxCat.id && (t.transactionAmount || 0) < 0).length;
                        if (count === 0) return null;
                        return (<button key={taxCat.id} onClick={() => setActiveTaxCategoryId(taxCat.id)} className={activeTaxCategoryId === taxCat.id ? 'active' : ''}>{taxCat.name} ({count})</button>);
                    })}
                </div>
            )}
        </>
    );
};