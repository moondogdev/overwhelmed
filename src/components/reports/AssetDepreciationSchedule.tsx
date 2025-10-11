import React from 'react';
import { DepreciableAsset, Settings } from '../../types';

interface AssetDepreciationScheduleProps {
  asset: DepreciableAsset;
  settings: Settings;
}

export const AssetDepreciationSchedule: React.FC<AssetDepreciationScheduleProps> = ({ asset, settings }) => {
  const selectedYear = settings.w2ManagerSelectedYear || new Date().getFullYear();

  const macrsRates: { [key: string]: number[] } = {
    '5-year': [0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576],
    '7-year': [0.1429, 0.2449, 0.1749, 0.1249, 0.0893, 0.0892, 0.0893, 0.0446],
  };

  const recoveryPeriodKey = asset.recoveryPeriod || (asset.assetCategory === 'computer_etc' ? '5-year' : asset.assetCategory === 'equipment' ? '7-year' : '');
  const rates = macrsRates[recoveryPeriodKey];
  const businessBasis = (asset.cost || 0) * ((asset.businessUsePercentage || 100) / 100);
  const acquiredDate = new Date(asset.dateAcquired);

  if (!rates || businessBasis <= 0 || isNaN(acquiredDate.getTime())) {
    return <div className="report-footnote">Enter valid asset details (cost, date, category) to view depreciation schedule.</div>;
  }

  const scheduleData = rates.map((rate, index) => {
    const yearStartDate = new Date(acquiredDate);
    yearStartDate.setFullYear(acquiredDate.getFullYear() + index);
    const isCurrentYear = yearStartDate.getFullYear() === selectedYear;
    const deduction = businessBasis * rate;
    return {
      year: yearStartDate.getFullYear(),
      rate: rate * 100,
      deduction,
      isCurrentYear,
    };
  });

  return (
    <div className="depreciation-schedule-container">
      <div className="depreciation-summary">
        <span><strong>Business Basis:</strong> ${businessBasis.toFixed(2)}</span>
        <span>({asset.cost.toFixed(2)} x {asset.businessUsePercentage || 100}%)</span>
        <span><strong>Recovery Period:</strong> {recoveryPeriodKey}</span>
      </div>
      <table className="report-table depreciation-schedule-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Rate</th>
            <th className="amount-column">Annual Deduction</th>
          </tr>
        </thead>
        <tbody>
          {scheduleData.map((row) => (
            <tr key={row.year} className={row.isCurrentYear ? 'current-year-row' : ''}>
              <td>{row.year}</td>
              <td>{row.rate.toFixed(2)}%</td>
              <td className="amount-column">${row.deduction.toFixed(2)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} style={{ textAlign: 'right' }}><strong>Total Deduction:</strong></td>
            <td className="amount-column">
              <strong>
                ${scheduleData.reduce((sum, row) => sum + row.deduction, 0).toFixed(2)}
              </strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};