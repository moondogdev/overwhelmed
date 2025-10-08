import React, { useMemo } from 'react';
import { Settings } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { SimpleAccordion } from '../sidebar/SimpleAccordion';

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