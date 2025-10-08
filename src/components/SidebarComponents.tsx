import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Settings, TaskType, AccordionProps, Account, TaxCategory, W2Data, DepreciableAsset } from '../types';
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
                {typeof title === 'string' ? <h4>{title}</h4> : <div className="accordion-title-wrapper">{title}</div>}
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

export function W2Manager() {
    const { settings, setSettings } = useAppContext();
    const selectedYear = settings.w2ManagerSelectedYear || new Date().getFullYear();

    const currentW2Data = useMemo(() => {
        return settings.w2Data?.[selectedYear] || {
            wages: 0,
            federalWithholding: 0,
            socialSecurityWithholding: 0,
            medicareWithholding: 0,
            taxpayerPin: '',
            employerEin: '',
            employerName: '',
            employerAddress: '',
            employeeName: '',
            employeeAddress: '',
        };
    }, [settings.w2Data, selectedYear]);

    const handleW2DataChange = (field: keyof W2Data, value: string) => {
        // For string fields, just use the value. For number fields, parse it.
        const isNumericField = ['wages', 'federalWithholding', 'socialSecurityWithholding', 'medicareWithholding'].includes(field);
        const updatedValue = isNumericField ? parseFloat(value) || 0 : value;

        const updatedW2Data = { ...currentW2Data, [field]: updatedValue };

        setSettings(prev => ({
            ...prev,
            w2Data: {
                ...(prev.w2Data || {}),
                [selectedYear]: updatedW2Data,
            }
        }));
    };

    const yearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear; i >= currentYear - 5; i--) {
            years.push(i);
        }
        return years.map(year => <option key={year} value={year}>{year}</option>);
    };

    return (
        <SimpleAccordion title="W-2 Manager">
            <div className="w2-manager-container">
                <label>
                    Tax Year:
                    <select value={selectedYear} onChange={(e) => setSettings(prev => ({ ...prev, w2ManagerSelectedYear: Number(e.target.value) }))}>
                        {yearOptions()}
                    </select>
                </label>
                <div className="w2-input-group">
                    <h5 className="w2-section-header">Employer Information</h5>
                    <label>Employer Identification Number (EIN)</label>
                    <input type="text" placeholder="e.g., 12-3456789" value={currentW2Data.employerEin || ''} onChange={(e) => handleW2DataChange('employerEin', e.target.value)} />
                    <label>Employer Name</label>
                    <input type="text" placeholder="Company Name" value={currentW2Data.employerName || ''} onChange={(e) => handleW2DataChange('employerName', e.target.value)} />
                    <label>Employer Address</label>
                    <textarea placeholder="Street, City, State, ZIP" value={currentW2Data.employerAddress || ''} onChange={(e) => handleW2DataChange('employerAddress', e.target.value)} rows={3} />

                    <h5 className="w2-section-header">Employee Information</h5>
                    <label>Employee Name</label>
                    <input type="text" placeholder="Your Name" value={currentW2Data.employeeName || ''} onChange={(e) => handleW2DataChange('employeeName', e.target.value)} />
                    <label>Employee Address</label>
                    <textarea placeholder="Your Street, City, State, ZIP" value={currentW2Data.employeeAddress || ''} onChange={(e) => handleW2DataChange('employeeAddress', e.target.value)} rows={3} />
                    <label>Wages, Tips, Other Comp (Box 1)</label>
                    <input type="number" placeholder="0.00" value={currentW2Data.wages || ''} onChange={(e) => handleW2DataChange('wages', e.target.value)} />
                    <label>Federal Tax Withheld (Box 2)</label>
                    <input type="number" placeholder="0.00" value={currentW2Data.federalWithholding || ''} onChange={(e) => handleW2DataChange('federalWithholding', e.target.value)} />
                    <label>Social Security Tax Withheld (Box 4)</label>
                    <input type="number" placeholder="0.00" value={currentW2Data.socialSecurityWithholding || ''} onChange={(e) => handleW2DataChange('socialSecurityWithholding', e.target.value)} />
                    <label>Medicare Tax Withheld (Box 6)</label>
                    <input type="number" placeholder="0.00" value={currentW2Data.medicareWithholding || ''} onChange={(e) => handleW2DataChange('medicareWithholding', e.target.value)} />
                    <label>Taxpayer PIN</label>
                    <input type="text" placeholder="Enter PIN" value={currentW2Data.taxpayerPin || ''} onChange={(e) => handleW2DataChange('taxpayerPin', e.target.value)} />
                </div>
            </div>
        </SimpleAccordion>
    );
}

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

function AssetDepreciationCalculator({ asset, handleUpdateAsset }: { asset: DepreciableAsset, handleUpdateAsset: (id: number, field: keyof DepreciableAsset, value: string | number | boolean) => void }): React.ReactNode {
  const { settings } = useAppContext();
  const selectedYear = settings.w2ManagerSelectedYear || new Date().getFullYear();

  useEffect(() => {
    const macrsRates: { [key: string]: number[] } = {
      '5-year': [0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576],
      '7-year': [0.1429, 0.2449, 0.1749, 0.1249, 0.0893, 0.0892, 0.0893, 0.0446],
    };
    const recoveryPeriodKey = asset.recoveryPeriod || (asset.assetCategory === 'computer_etc' ? '5-year' : asset.assetCategory === 'equipment' ? '7-year' : '');
    const rates = macrsRates[recoveryPeriodKey];
    const businessBasis = (asset.cost || 0) * ((asset.businessUsePercentage || 100) / 100);
    const acquiredDate = new Date(asset.dateAcquired);

    if (rates && businessBasis > 0 && !isNaN(acquiredDate.getTime())) {
      const acquiredYear = acquiredDate.getFullYear();
      const recoveryYearIndex = selectedYear - acquiredYear;
      if (recoveryYearIndex >= 0 && recoveryYearIndex < rates.length) {
        const deduction = businessBasis * rates[recoveryYearIndex];
        if (asset.currentYearDepreciation !== deduction) {
          handleUpdateAsset(asset.id, 'currentYearDepreciation', deduction);
        }
      }
    }
  }, [asset.cost, asset.businessUsePercentage, asset.recoveryPeriod, asset.assetCategory, asset.dateAcquired, selectedYear, asset.id, handleUpdateAsset, asset.currentYearDepreciation]);

  return null; // This component does not render anything.
}

export function DepreciableAssetsManager() {
  const { settings, setSettings } = useAppContext();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddAsset = () => {
    const newAsset: DepreciableAsset = {
      id: Date.now(),
      description: 'New Asset',
      dateAcquired: new Date().toISOString().split('T')[0],
      cost: 0,
      purchasedNew: true,
      dateSold: '',
      businessUsePercentage: 100,
      assetCategory: 'computer_etc',
      assetType: 'computer',
      priorYear179Expense: 0,
      recoveryPeriod: '5-year',
      priorYearBonusDepreciationTaken: false,
      priorYearDepreciation: 0,
      priorYearAmtDepreciation: 0,
      currentYearDepreciation: 0,
    };
    setSettings(prev => ({ ...prev, depreciableAssets: [...(prev.depreciableAssets || []), newAsset] }));
  };

  const handleUpdateAsset = (id: number, field: keyof DepreciableAsset, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      depreciableAssets: (prev.depreciableAssets || []).map(asset =>
        asset.id === id ? { ...asset, [field]: value } : asset
      ),
    }));
  };

  const handleDeleteAsset = (id: number) => {
    if (confirmingDeleteId === id) {
      setSettings(prev => ({ ...prev, depreciableAssets: (prev.depreciableAssets || []).filter(asset => asset.id !== id) }));
      setConfirmingDeleteId(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteId(id);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteId(null), 3000);
    }
  };

  return (
    <SimpleAccordion title="Depreciable Assets">
      <div className="category-manager-list">
        {(settings.depreciableAssets || []).map(asset => (
          <SimpleAccordion 
            key={asset.id} 
            className="category-manager-group asset-accordion"
            title={
              <div className="category-manager-item">
                <input type="text" value={asset.description} onChange={(e) => handleUpdateAsset(asset.id, 'description', e.target.value)} onClick={(e) => e.stopPropagation()} />
                <button className={`remove-link-btn ${confirmingDeleteId === asset.id ? 'confirm-delete' : ''}`} onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }}><i className={`fas ${confirmingDeleteId === asset.id ? 'fa-check' : 'fa-minus'}`}></i></button>
              </div>
            }
          >
            <div className="w2-input-group asset-details">
              <AssetDepreciationCalculator asset={asset} handleUpdateAsset={handleUpdateAsset} />
              <label>Original Cost or Basis:
                <i className="fas fa-info-circle tooltip-icon" title={(() => {
                  const macrsRates: { [key: string]: number[] } = {
                    '5-year': [0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576],
                    '7-year': [0.1429, 0.2449, 0.1749, 0.1249, 0.0893, 0.0892, 0.0893, 0.0446],
                  };

                  // Use the explicit recoveryPeriod if set, otherwise fallback to category default.
                  const recoveryPeriodKey = asset.recoveryPeriod || (() => {
                    if (asset.assetCategory === 'computer_etc') return '5-year';
                    if (asset.assetCategory === 'equipment') return '7-year';
                    return '';
                  })();

                  if (!recoveryPeriodKey || !macrsRates[recoveryPeriodKey]) {
                    return 'Select a valid asset category (e.g., Computer or Equipment) to see depreciation schedule.';
                  }

                  const rates = macrsRates[recoveryPeriodKey];
                  const businessBasis = (asset.cost || 0) * ((asset.businessUsePercentage || 100) / 100);

                  if (businessBasis === 0) {
                    return 'Enter a cost to calculate the depreciation schedule.';
                  }

                  const acquiredDate = new Date(asset.dateAcquired);
                  if (isNaN(acquiredDate.getTime())) {
                    return 'Enter a valid acquisition date to see the schedule.';
                  }

                  const currentTaxYear = settings.w2ManagerSelectedYear || new Date().getFullYear();
                  let schedule = `Depreciation Schedule (${recoveryPeriodKey} Property)\n`;
                  schedule += `Business Basis: $${businessBasis.toFixed(2)} (${asset.cost.toFixed(2)} x ${asset.businessUsePercentage || 100}%)\n`;
                  schedule += '--------------------------------------------------------\n';
                  schedule += 'Year Range          | Rate    | Annual Deduction\n';
                  schedule += '--------------------------------------------------------\n';

                  let totalDeduction = 0;
                  rates.forEach((rate, index) => {
                    const yearStartDate = new Date(acquiredDate);
                    yearStartDate.setFullYear(acquiredDate.getFullYear() + index);

                    const yearEndDate = new Date(yearStartDate);
                    yearEndDate.setFullYear(yearStartDate.getFullYear() + 1);
                    yearEndDate.setDate(yearEndDate.getDate() - 1);
                    
                    const isCurrentYear = yearStartDate.getFullYear() === currentTaxYear;

                    const yearRange = `${yearStartDate.toLocaleDateString()} - ${yearEndDate.toLocaleDateString()}`;
                    const deduction = businessBasis * rate;
                    totalDeduction += deduction;
                    schedule += `${yearRange.padEnd(22)}| ${(rate * 100).toFixed(2).padStart(7,' ')}% | $${deduction.toFixed(2).padStart(15, ' ')}${isCurrentYear ? ' <--' : ''}\n`;
                  });
                  schedule += '--------------------------------------------------------\n';
                  schedule += `Total Deduction: $${totalDeduction.toFixed(2)}`;

                  return schedule;
                })()}></i>
                <input type="number" placeholder="Cost" value={asset.cost || ''} onChange={(e) => handleUpdateAsset(asset.id, 'cost', parseFloat(e.target.value) || 0)} /></label>
              <label>Date Acquired:<input type="date" value={asset.dateAcquired} onChange={(e) => handleUpdateAsset(asset.id, 'dateAcquired', e.target.value)} /></label>
              <label>Did you purchase this asset new?
                <select value={String(asset.purchasedNew !== false)} onChange={(e) => handleUpdateAsset(asset.id, 'purchasedNew', e.target.value === 'true')}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              
              <label>Which category best describes your {asset.description}? <span className="input-sub-label">({settings.businessName || 'Business'})</span>
                <i className="fas fa-info-circle tooltip-icon" title={
`Depreciation Details (GDS):
---------------------------------
• Equipment (Computers, phones, cameras):
  - 5 years, 200% Declining Balance

• Equipment (Furniture, machinery, tools):
  - 7 years, 200% Declining Balance

• Real Estate (Residential/Commercial):
  - 27.5 or 39 years, Straight Line

• Other (Land improvements, amortizables):
  - 15 years, 150% DB or Straight Line`}></i>
                <select value={asset.assetCategory} onChange={(e) => handleUpdateAsset(asset.id, 'assetCategory', e.target.value)}>
                  <option value="computer_etc">Computer, cell phone, copier, etc.</option>
                  <option value="equipment">Equipment</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
                <label style={{marginTop: '10px'}}>Recovery Period (Override):
                  <select value={asset.recoveryPeriod || ''} onChange={(e) => handleUpdateAsset(asset.id, 'recoveryPeriod', e.target.value as '5-year' | '7-year')}>
                    <option value="">Auto (from Category)</option>
                    <option value="5-year">5-Year Property</option>
                    <option value="7-year">7-Year Property</option>
                  </select>
                </label>
              </label>

              {asset.assetCategory === 'computer_etc' && (
                <div className="asset-sub-category">
                  <label>Which type best describes your {asset.description}? <span className="input-sub-label">({settings.businessName || 'Business'})</span></label>
                  <select value={asset.assetType} onChange={(e) => handleUpdateAsset(asset.id, 'assetType', e.target.value)}>
                    <option value="computer">Computer or peripheral equipment</option>
                    <option value="cell_phone">Cell phone or similar</option>
                    <option value="photo_video">Photo, video, communication equipment</option>
                    <option value="copier">Copiers</option>
                  </select>
                </div>
              )}

              <label>Percentage of this asset used for business purposes:<input type="number" min="0" max="100" placeholder="100" value={asset.businessUsePercentage || ''} onChange={(e) => handleUpdateAsset(asset.id, 'businessUsePercentage', parseFloat(e.target.value) || 0)} /></label>
              <label>Date Sold, Disposed of, or Retired:<input type="date" value={asset.dateSold || ''} onChange={(e) => handleUpdateAsset(asset.id, 'dateSold', e.target.value)} /></label>

              <h5 className="w2-section-header" style={{ borderTop: '1px solid #444', paddingTop: '15px', marginTop: '15px' }}>Additional Depreciable Asset Info ({settings.businessName || 'Business'})</h5>
              <label>Prior-Year Section 179 Expense
                <span className="input-sub-label" style={{ marginTop: '4px', marginBottom: '4px' }}>Enter any Section 179 expense taken in a prior year:</span>
                <input type="number" placeholder="0.00" value={asset.priorYear179Expense || ''} onChange={(e) => handleUpdateAsset(asset.id, 'priorYear179Expense', parseFloat(e.target.value) || 0)} />
                <span className="input-sub-label">(This Section 179 expense is for any year prior to {settings.w2ManagerSelectedYear || new Date().getFullYear()})</span></label>
              <label>Prior-Year Depreciation
                <span className="input-sub-label" style={{ marginTop: '4px', marginBottom: '4px' }}>Enter the total accumulated depreciation, other than prior Section 179 expense and bonus depreciation, taken in prior years for this asset:</span>
                <input type="number" placeholder="0.00" value={asset.priorYearDepreciation || ''} onChange={(e) => handleUpdateAsset(asset.id, 'priorYearDepreciation', parseFloat(e.target.value) || 0)} />
              </label>
              <label>Prior-Year AMT Depreciation
                <span className="input-sub-label" style={{ marginTop: '4px', marginBottom: '4px' }}>Enter the total accumulated Alternative Minimum Tax (AMT) depreciation taken in prior years for this asset:</span>
                <input type="number" placeholder="0.00" value={asset.priorYearAmtDepreciation || ''} onChange={(e) => handleUpdateAsset(asset.id, 'priorYearAmtDepreciation', parseFloat(e.target.value) || 0)} />
              </label>
              <label>Prior-Year Bonus Depreciation
                <span className="input-sub-label" style={{ marginTop: '4px', marginBottom: '4px' }}>Did you take the one-time bonus depreciation deduction for your {asset.description} that was placed in service in {new Date(asset.dateAcquired).getFullYear()}?</span>
                <select value={String(asset.priorYearBonusDepreciationTaken === true)} onChange={(e) => handleUpdateAsset(asset.id, 'priorYearBonusDepreciationTaken', e.target.value === 'true')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>
              <label>{settings.w2ManagerSelectedYear || new Date().getFullYear()} Depreciation Deduction:
                <span className="input-sub-label" style={{ marginTop: '4px', marginBottom: '4px' }}>Enter the depreciation deduction for the current tax year.</span>
                <input type="number" placeholder="0.00" value={asset.currentYearDepreciation ? asset.currentYearDepreciation.toFixed(2) : '0.00'} readOnly style={{ backgroundColor: '#21252b', cursor: 'not-allowed' }} />
                {(() => {
                  const totalPriorDepreciation = (asset.priorYear179Expense || 0) + (asset.priorYearDepreciation || 0);
                  const newTotalDepreciation = totalPriorDepreciation + (asset.currentYearDepreciation || 0);
                  return (
                    <span className="input-sub-label" style={{ fontStyle: 'italic', color: '#ccc', marginTop: '4px' }}>
                      Prior Dep: ${totalPriorDepreciation.toFixed(2)} | New Total: ${newTotalDepreciation.toFixed(2)}
                    </span>
                  );
                })()}
              </label>
            </div>
          </SimpleAccordion>
        ))}
      </div>
      <button className="add-link-btn" onClick={handleAddAsset}><i className="fas fa-plus"></i> Add Asset</button>
    </SimpleAccordion>
  );
}

export function VehicleInformationManager() {
  const { settings, setSettings, tasks, completedTasks } = useAppContext();

  const handleSettingChange = (field: keyof Settings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const expenseCategories = useMemo(() => {
    const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
    if (!transactionsCategory) return [];
    return settings.categories.filter(c => c.parentId === transactionsCategory.id);
  }, [settings.categories]);

  const mileageCalculation = useMemo(() => {
    const { vehicleGasCategoryId, vehicleGasPrice, vehicleMpgLow, vehicleMpgHigh } = settings;
    if (!vehicleGasCategoryId || !vehicleGasPrice || !vehicleMpgLow || !vehicleMpgHigh) {
      return null;
    }

    const totalSpentOnGas = [...tasks, ...completedTasks]
      .filter(t => t.categoryId === vehicleGasCategoryId && t.transactionType === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.transactionAmount || 0), 0);

    if (totalSpentOnGas === 0) return null;

    const gallons = totalSpentOnGas / vehicleGasPrice;
    const milesLow = gallons * vehicleMpgLow;
    const milesHigh = gallons * vehicleMpgHigh;
    const gasCategoryName = settings.categories.find(c => c.id === vehicleGasCategoryId)?.name || 'Selected Category';

    return { totalSpentOnGas, gasPricePerGallon: vehicleGasPrice, gasMpgLow: vehicleMpgLow, gasMpgHigh: vehicleMpgHigh, milesLow, milesHigh, gasCategoryName };

  }, [tasks, completedTasks, settings]);


  return (
    <SimpleAccordion title="Vehicle Information">
      <div className="w2-manager-container">
        <div className="w2-input-group">
          <label>Make and Model of Vehicle</label>
          <input type="text" placeholder="e.g., Toyota Camry" value={settings.vehicleMakeModel || ''} onChange={(e) => handleSettingChange('vehicleMakeModel', e.target.value)} />

          <label>Type of Vehicle</label>
          <select value={settings.vehicleType} onChange={(e) => handleSettingChange('vehicleType', e.target.value)}>
            <option value="auto_light">Automobile (under 6,000 lbs)</option>
            <option value="truck_van_suv_light">Light truck, van, or SUV (under 6,000 lbs)</option>
            <option value="truck_van_heavy">Heavy truck or van (over 6,000 lbs)</option>
            <option value="suv_heavy">Heavy SUV (over 6,000 lbs)</option>
          </select>

          <label>Date Placed in Service</label>
          <input type="date" value={settings.vehicleDateInService || ''} onChange={(e) => handleSettingChange('vehicleDateInService', e.target.value)} />

          <label>Did you use the Standard Mileage method the first year you placed your {settings.vehicleMakeModel || 'vehicle'} in service?</label>
          <div className="radio-group">
            <label><input type="radio" name="usedStandardMileage" value="yes" checked={settings.vehicleUsedStandardMileage === true} onChange={() => handleSettingChange('vehicleUsedStandardMileage', true)} /> Yes</label>
            <label><input type="radio" name="usedStandardMileage" value="no" checked={settings.vehicleUsedStandardMileage === false} onChange={() => handleSettingChange('vehicleUsedStandardMileage', false)} /> No</label>
          </div>

          <h5 className="w2-section-header">Mileage Details</h5>
          <label>Total Miles Driven For All Purposes</label>
          <input type="number" placeholder="0" value={settings.vehicleTotalMiles || ''} onChange={(e) => handleSettingChange('vehicleTotalMiles', parseFloat(e.target.value) || 0)} />

          <label>Business Miles</label>
          <input type="number" placeholder="0" value={settings.vehicleBusinessMiles || ''} onChange={(e) => handleSettingChange('vehicleBusinessMiles', parseFloat(e.target.value) || 0)} />
          {(settings.vehicleBusinessMiles || 0) > 0 && (
            <div className="mileage-deduction-summary">
              <span className="summary-label">Projected Standard Deduction:</span>
              <span className="summary-value expense">
                ${((settings.vehicleBusinessMiles || 0) * 0.67).toFixed(2)}
              </span>
            </div>
          )}

        <h5 className="w2-section-header">Other Vehicle Expenses</h5>
        <label>Business Parking Fees/Tolls:
          <input type="number" placeholder="0.00" value={settings.vehicleParkingTollsAmount || ''} onChange={(e) => handleSettingChange('vehicleParkingTollsAmount', parseFloat(e.target.value) || 0)} />
          <select value={settings.vehicleParkingTollsTaxCategoryId || ''} onChange={(e) => handleSettingChange('vehicleParkingTollsTaxCategoryId', e.target.value ? Number(e.target.value) : undefined)} title="Assign Tax Category">
            <option value="">-- Assign Tax Category --</option>
            {(settings.taxCategories || []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </label>

        <label>Property Taxes Paid:
          <input type="number" placeholder="0.00" value={settings.vehiclePropertyTaxesAmount || ''} onChange={(e) => handleSettingChange('vehiclePropertyTaxesAmount', parseFloat(e.target.value) || 0)} />
          <select value={settings.vehiclePropertyTaxesTaxCategoryId || ''} onChange={(e) => handleSettingChange('vehiclePropertyTaxesTaxCategoryId', e.target.value ? Number(e.target.value) : undefined)} title="Assign Tax Category">
            <option value="">-- Assign Tax Category --</option>
            {(settings.taxCategories || []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </label>

        <label>Car Loan Interest Paid:
          <input type="number" placeholder="0.00" value={settings.vehicleLoanInterestAmount || ''} onChange={(e) => handleSettingChange('vehicleLoanInterestAmount', parseFloat(e.target.value) || 0)} />
          <select value={settings.vehicleLoanInterestTaxCategoryId || ''} onChange={(e) => handleSettingChange('vehicleLoanInterestTaxCategoryId', e.target.value ? Number(e.target.value) : undefined)} title="Assign Tax Category">
            <option value="">-- Assign Tax Category --</option>
            {(settings.taxCategories || []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </label>

          <label>Commuting Miles</label>
          <input type="number" placeholder="0" value={settings.vehicleCommutingMiles || ''} onChange={(e) => handleSettingChange('vehicleCommutingMiles', parseFloat(e.target.value) || 0)} />

          <label>Average Daily Commute Miles</label>
          <input type="number" placeholder="0" value={settings.vehicleAvgDailyCommute || ''} onChange={(e) => handleSettingChange('vehicleAvgDailyCommute', parseFloat(e.target.value) || 0)} />

          <h5 className="w2-section-header">Mileage Estimate Calculator</h5>
          <label>Gas Expense Category</label>
          <select
            value={settings.vehicleGasCategoryId || ''}
            onChange={(e) => handleSettingChange('vehicleGasCategoryId', parseFloat(e.target.value) || undefined)}
          >
            <option value="">-- Select a Category --</option>
            {expenseCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <label>Price Per Gallon ($)</label>
          <input type="number" placeholder="e.g., 3.50" value={settings.vehicleGasPrice || ''} onChange={(e) => handleSettingChange('vehicleGasPrice', parseFloat(e.target.value) || 0)} />

          <label>Vehicle MPG (Low Estimate)</label>
          <input type="number" placeholder="e.g., 22" value={settings.vehicleMpgLow || ''} onChange={(e) => handleSettingChange('vehicleMpgLow', parseFloat(e.target.value) || 0)} />

          <label>Vehicle MPG (High Estimate)</label>
          <input type="number" placeholder="e.g., 32" value={settings.vehicleMpgHigh || ''} onChange={(e) => handleSettingChange('vehicleMpgHigh', parseFloat(e.target.value) || 0)} />
          {mileageCalculation && (
            <div className="mileage-summary-sidebar">
              <p>
                Estimated mileage for <strong>${mileageCalculation.totalSpentOnGas.toFixed(2)}</strong> spent on {mileageCalculation.gasCategoryName}:
              </p>
              <div className="mileage-result-sidebar">
                <span>{mileageCalculation.milesLow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span className="to-text">to</span>
                <span>{mileageCalculation.milesHigh.toLocaleString(undefined, { maximumFractionDigits: 0 })} miles</span>
              </div>
              <p className="report-footnote" style={{ textAlign: 'left', marginTop: '10px' }}>
                This estimate is based on all transactions in the selected gas category across all time.
              </p>
            </div>
          )}
        </div>
      </div>
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
                        <div className="category-manager-item sub keywords">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                placeholder="Deductible % (default 100)"
                                defaultValue={category.deductiblePercentage || ''}
                                onBlur={(e) => {
                                    const percentage = parseInt(e.target.value, 10);
                                    handleUpdateTaxCategory(category.id, { deductiblePercentage: isNaN(percentage) ? undefined : Math.max(1, Math.min(100, percentage)) });
                                }}
                            />
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