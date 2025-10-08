import React from 'react';
import { SimpleAccordion } from '../SidebarComponents';
import { useAppContext } from '../../contexts/AppContext';
import { CategoryOptions } from '../TaskView';
export function BulkAdd() {
  const {
    bulkAddText, setBulkAddText, handleBulkAdd,
    bulkAddCategoryId, setBulkAddCategoryId,
    bulkAddPriority, setBulkAddPriority,
    bulkAddCompleteBy, setBulkAddCompleteBy,
    bulkAddTaxCategoryId, setBulkAddTaxCategoryId,
    bulkAddTransactionType, setBulkAddTransactionType, bulkAddAccountId, setBulkAddAccountId,
    bulkAddYear, setBulkAddYear,
    settings
  } = useAppContext();

  const yearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear + 1; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years.map(year => <option key={year} value={year}>{year}</option>);
  };

  return (
    <SimpleAccordion title="Bulk Add Tasks">
      <div className="bulk-add-options">
        <label>
          Category:
          <select value={bulkAddCategoryId} onChange={(e) => setBulkAddCategoryId(e.target.value === 'default' ? 'default' : Number(e.target.value))}>
            <option value="default">Use Current View</option>
            <CategoryOptions categories={settings.categories} />
          </select>
        </label>
        <label>
          Priority:
          <select value={bulkAddPriority} onChange={(e) => setBulkAddPriority(e.target.value as any)}>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Low">Low</option>
          </select>
        </label>
        <label>
          Due Date:
          <input type="datetime-local" value={bulkAddCompleteBy} onChange={(e) => setBulkAddCompleteBy(e.target.value)} />
        </label>
        <label>
          Default Transaction Type:
          <select value={bulkAddTransactionType} onChange={(e) => setBulkAddTransactionType(e.target.value as any)}>
            <option value="none">None</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
        </label>
        {bulkAddTransactionType !== 'none' && (
          <label>
            Account:
            <select value={bulkAddAccountId || ''} onChange={(e) => setBulkAddAccountId(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">-- Select Account --</option>
              {settings.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </label>
        )}
        {bulkAddTransactionType !== 'none' && (
          <label>
            Tax Category:
            <select value={bulkAddTaxCategoryId || ''} onChange={(e) => setBulkAddTaxCategoryId(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">-- None --</option>
              {(settings.taxCategories || []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </label>
        )}
        {bulkAddTransactionType !== 'none' && (
          <label>
            For Year:
            <select value={bulkAddYear} onChange={(e) => setBulkAddYear(Number(e.target.value))}>
              {yearOptions()}
            </select>
          </label>
        )}
      </div>
      <textarea
        placeholder="Add multiple tasks, separated by new lines or commas..."
        value={bulkAddText}
        onChange={(e) => setBulkAddText(e.target.value)}
        rows={5}
      />
      <button onClick={() => handleBulkAdd({ categoryId: bulkAddCategoryId, priority: bulkAddPriority, completeBy: bulkAddCompleteBy, transactionType: bulkAddTransactionType, accountId: bulkAddAccountId, taxCategoryId: bulkAddTaxCategoryId }, bulkAddYear)}>Add Tasks</button>
    </SimpleAccordion>
  );
}