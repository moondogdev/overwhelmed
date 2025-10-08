import React, { useMemo } from 'react';
import { Task } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { SimpleAccordion } from '../sidebar/SimpleAccordion';

export function BusinessInfoManager() {
  const { settings, setSettings, tasks, completedTasks } = useAppContext();
  const selectedYear = settings.w2ManagerSelectedYear || new Date().getFullYear();

  const businessIncomeForYear = useMemo(() => {
    const yearTasks = [...tasks, ...completedTasks].filter(task => {
      const taskYear = new Date(task.openDate).getFullYear();
      return taskYear === selectedYear && task.incomeType === 'business';
    });

    const getTaskIncome = (task: Task) => ((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0);

    return yearTasks.reduce((sum, t) => sum + getTaskIncome(t), 0);
  }, [selectedYear, tasks, completedTasks]);

  const handleBusinessDataChange = (field: 'returnsAndAllowances' | 'miscIncome' | 'qbiEffectivelyConnected' | 'qbiFormerEmployer', value: string | boolean) => {
    const finalValue = typeof value === 'boolean' ? value : parseFloat(value) || 0;
    setSettings(prev => ({
      ...prev,
      businessData: {
        ...(prev.businessData || {}),
        [selectedYear]: {
          ...(prev.businessData?.[selectedYear]),
          [field]: finalValue,
        }
      }
    }));
  };

  return (
    <SimpleAccordion title="Business Information">
      <div className="w2-manager-container">
        <div className="w2-input-group">
          <label>Business Name (for 1099s)</label>
          <input type="text" placeholder="Enter LLC or Business Name" value={settings.businessName || ''} onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))} />
          <label>Business EIN</label>
          <input type="text" placeholder="e.g., 98-7654321" value={settings.businessEin || ''} onChange={(e) => setSettings(prev => ({ ...prev, businessEin: e.target.value }))} />
          <label>Type of Work</label>
          <span className="input-sub-label">Which code fits your business?</span>
          <input type="text" placeholder="e.g., Software Development" value={settings.businessTypeOfWork || ''} onChange={(e) => setSettings(prev => ({ ...prev, businessTypeOfWork: e.target.value }))} />
          <label>Business Code</label>
          <input type="text" placeholder="e.g., 541511" value={settings.businessCode || ''} onChange={(e) => setSettings(prev => ({ ...prev, businessCode: e.target.value }))} />

          <h5 className="w2-section-header">Gross Receipts or Sales: ${businessIncomeForYear.toFixed(2)}</h5>
          <label>
            <span className="input-sub-label" style={{ marginTop: '0', marginBottom: '4px' }}>Total gross receipts or sales generated from business-related transactions for {selectedYear}.</span>
          </label>
          <label>Returns and Allowances
            <span className="input-sub-label" style={{ marginTop: '4px', marginBottom: '4px' }}>Enter the amount of any returns expense or allowance expense:</span>
            <input type="number" placeholder="0.00" value={settings.businessData?.[selectedYear]?.returnsAndAllowances || ''} onChange={(e) => handleBusinessDataChange('returnsAndAllowances', e.target.value)} />
          </label>
          <label>Miscellaneous Income
            <span className="input-sub-label" style={{ marginTop: '4px', marginBottom: '4px' }}>Enter any other miscellaneous income related to this business:</span>
            <input type="number" placeholder="0.00" value={settings.businessData?.[selectedYear]?.miscIncome || ''} onChange={(e) => handleBusinessDataChange('miscIncome', e.target.value)} />
          </label>

          <h5 className="w2-section-header">Qualified Business Income Deduction</h5>
          <label>Is this business effectively connected with the conduct of trade or business within the United States?
            <select value={String(settings.businessData?.[selectedYear]?.qbiEffectivelyConnected !== false)} onChange={(e) => handleBusinessDataChange('qbiEffectivelyConnected', e.target.value === 'true')}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <label>Are you providing services to a former employer that are substantially the same as when you were an employee?
            <select value={String(settings.businessData?.[selectedYear]?.qbiFormerEmployer === true)} onChange={(e) => handleBusinessDataChange('qbiFormerEmployer', e.target.value === 'true')}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </label>
        </div>
      </div>
    </SimpleAccordion>
  );
}