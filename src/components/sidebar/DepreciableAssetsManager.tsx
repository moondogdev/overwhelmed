import React, { useState, useRef, useEffect } from 'react';
import { DepreciableAsset } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { SimpleAccordion } from '../sidebar/SimpleAccordion';

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

    if (asset.isFullyDepreciated) {
      if (asset.currentYearDepreciation !== 0) {
        handleUpdateAsset(asset.id, 'currentYearDepreciation', 0);
      }
      return; // Asset is manually marked as fully depreciated, so no calculation needed.
    }

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
  }, [asset.cost, asset.businessUsePercentage, asset.recoveryPeriod, asset.assetCategory, asset.dateAcquired, selectedYear, asset.id, handleUpdateAsset, asset.currentYearDepreciation, asset.isFullyDepreciated]);

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
      isFullyDepreciated: false,
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
                  schedule += `Business Basis: $${businessBasis.toFixed(2)} (${(asset.cost || 0).toFixed(2)} x ${asset.businessUsePercentage || 100}%)\n`;
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
              <label className="checkbox-label" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={asset.isFullyDepreciated || false} onChange={(e) => handleUpdateAsset(asset.id, 'isFullyDepreciated', e.target.checked)} />
                <span className='checkbox-label-text'>Asset Fully Depreciated</span>
              </label>
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