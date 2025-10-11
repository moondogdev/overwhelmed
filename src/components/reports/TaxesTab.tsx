import React from 'react';
import { SimpleAccordion } from '../SidebarComponents';
import { AssetDepreciationSchedule } from './AssetDepreciationSchedule';
import { Task, Settings } from '../../types';

interface TaxReportData {
    name: string;
    tasks: Task[];
    total: number;
}

interface TaxIncomeReportData {
    name: string;
    tasks: Task[];
    total: number;
    transactionTotal: number;
}

interface IncomeByType {
    name: string;
    tasks: Task[];
    total: number;
}

interface TransactionsByTaxCategory {
    name: string;
    tasks: Task[];
    total: number;
}

interface TaxesTabProps {
    settings: Settings;
    setSettings: (update: React.SetStateAction<Settings>) => void;
    tasks: Task[];
    completedTasks: Task[];
    selectedTaxYear: number | 'all' | null;
    taxReportData: TaxReportData[] | null;
    taxIncomeReportData: TaxIncomeReportData[] | null;
    incomeByType: IncomeByType[];
    transactionsByTaxCategory: Map<number, TransactionsByTaxCategory>;
    navigateToTask: (taskId: number) => void;
    showToast: (message: string) => void;
}

export const TaxesTab: React.FC<TaxesTabProps> = ({
    settings,
    setSettings,
    tasks,
    completedTasks,
    selectedTaxYear,
    taxReportData,
    taxIncomeReportData,
    incomeByType,
    transactionsByTaxCategory,
    navigateToTask,
    showToast,
}) => {

    const renderYearlyReport = () => {
        if (!selectedTaxYear || !taxReportData) return null;

        const w2DataForYear = typeof selectedTaxYear === 'number' ? settings.w2Data?.[selectedTaxYear] : undefined;
        const totalWithheld = (w2DataForYear?.federalWithholding || 0) + (w2DataForYear?.socialSecurityWithholding || 0) + (w2DataForYear?.medicareWithholding || 0);
        const totalIncome = (taxIncomeReportData || []).reduce((sum, cat) => sum + cat.total, 0);
        const totalDeductibleExpenses = taxReportData.reduce((sum, cat) => sum + cat.total, 0);
        const businessIncome = (taxIncomeReportData || []).find(cat => cat.name === 'Business Income (1099)')?.total || 0;
        const w2WagesAfterTaxes = (w2DataForYear?.wages || 0) - totalWithheld;
        const reimbursementIncome = (taxIncomeReportData || []).find(g => g.name === 'Reimbursements')?.total || 0;
        const allYearExpenses = [...tasks, ...completedTasks].filter(task => new Date(task.openDate).getFullYear() === selectedTaxYear && task.transactionType === 'expense');
        const totalYearExpenses = allYearExpenses.reduce((sum, task) => sum + Math.abs(task.transactionAmount || 0), 0);
        const nonDeductibleSpending = totalYearExpenses - totalDeductibleExpenses;
        const finalTakeHome = w2WagesAfterTaxes + businessIncome + reimbursementIncome - totalYearExpenses;

        const totalCurrentYearDepreciation = (settings.depreciableAssets || []).reduce((sum, asset) => {
            const acquiredYear = new Date(asset.dateAcquired).getFullYear();
            const recoveryYears = asset.recoveryPeriod === '7-year' ? 7 : 5;
            if (typeof selectedTaxYear === 'number' && selectedTaxYear > acquiredYear + recoveryYears) {
                return sum; // Asset is fully depreciated for the selected year
            }
            if (asset.isFullyDepreciated) {
                return sum; // Asset is manually marked as fully depreciated
            }
            return sum + (asset.currentYearDepreciation || 0);
        }, 0);

        const standardMileageDeduction = (settings.vehicleBusinessMiles || 0) * 0.67;
        const otherVehicleExpensesTotal = [
            settings.vehicleParkingTollsAmount || 0,
            settings.vehiclePropertyTaxesAmount || 0,
            settings.vehicleLoanInterestAmount || 0,
        ].reduce((sum, exp) => sum + exp, 0);
        const totalVehicleDeduction = standardMileageDeduction + otherVehicleExpensesTotal;

        const handleCopySimplifiedReportAsText = () => {
            let reportText = `Tax Report Summary for ${selectedTaxYear}\n`;
            if (settings.businessName) {
                reportText += `${settings.businessName}\n`;
            }
            if (w2DataForYear?.taxpayerPin) {
                reportText += `Taxpayer PIN: ${w2DataForYear.taxpayerPin}\n`;
            }
            reportText += `\n--- SUMMARY ---\n`;
            reportText += `Total Income: $${totalIncome.toFixed(2)}\n`;
            if (totalWithheld > 0) {
                reportText += `Total W-2 Taxes Withheld: $${totalWithheld.toFixed(2)}\n`;
            }
            reportText += `Total Deductible Business (1099) Expenses: $${totalDeductibleExpenses.toFixed(2)}\n`;
            reportText += `\n--- FINAL NET CALCULATIONS ---\n`;
            if (w2DataForYear?.wages > 0) {
                reportText += `W2 Wages: $${(w2DataForYear.wages).toFixed(2)}\n`;
                if (totalWithheld > 0) {
                    reportText += `W-2 Taxes Withheld: $${totalWithheld.toFixed(2)}\n`;
                }
            }
            reportText += `Non-Deductible Spending: $${nonDeductibleSpending.toFixed(2)}\n`;
            reportText += `Reimbursements / Non-Taxable: $${reimbursementIncome.toFixed(2)}\n`;
            reportText += `Business Income: $${businessIncome.toFixed(2)}\n`;
            reportText += `Deductible Business Expenses: $${totalDeductibleExpenses.toFixed(2)}\n`;
            reportText += `Estimated Net (Take-Home): $${finalTakeHome.toFixed(2)}\n`;

            reportText += `\n\n--- INCOME CATEGORY TOTALS ---\n`;
            (taxIncomeReportData || []).forEach(cat => reportText += `${cat.name}: $${cat.total.toFixed(2)}\n`);

            reportText += `\n\n--- DEDUCTIBLE EXPENSE CATEGORY TOTALS ---\n`;
            taxReportData.forEach(cat => reportText += `${cat.name}: $${cat.total.toFixed(2)}\n`);

            if (w2DataForYear && totalWithheld > 0) {
                reportText += `\n\n--- W-2 TAX WITHHELD DETAILS ---\n`;
                if (w2DataForYear.federalWithholding > 0) reportText += `Federal Tax Withheld: $${w2DataForYear.federalWithholding.toFixed(2)}\n`;
                if (w2DataForYear.socialSecurityWithholding > 0) reportText += `Social Security Tax Withheld: $${w2DataForYear.socialSecurityWithholding.toFixed(2)}\n`;
                if (w2DataForYear.medicareWithholding > 0) reportText += `Medicare Tax Withheld: $${w2DataForYear.medicareWithholding.toFixed(2)}\n`;
            }

            navigator.clipboard.writeText(reportText).then(() => showToast('Report summary copied as text!'));
        };

        const handleCopyReportAsText = () => {
            let reportText = `Tax Report for ${selectedTaxYear}\n`;
            if (settings.businessName) {
                reportText += `${settings.businessName}\n`;
            }
            if (w2DataForYear?.taxpayerPin) {
                reportText += `Taxpayer PIN: ${w2DataForYear.taxpayerPin}\n`;
            }
            reportText += `\n--- SUMMARY ---\n`;
            reportText += `Total Income: $${totalIncome.toFixed(2)}\n`;
            if (totalWithheld > 0) {
                reportText += `Total W-2 Taxes Withheld: $${totalWithheld.toFixed(2)}\n`;
            }
            reportText += `Total Deductible Business (1099) Expenses: $${totalDeductibleExpenses.toFixed(2)}\n`;
            reportText += `\n--- FINAL NET CALCULATIONS ---\n`;
            if (w2DataForYear?.wages > 0) {
                reportText += `W2 Wages: $${(w2DataForYear.wages).toFixed(2)}\n`;
                if (totalWithheld > 0) {
                    reportText += `W-2 Taxes Withheld: $${totalWithheld.toFixed(2)}\n`;
                }
            }
            reportText += `Non-Deductible Spending: $${nonDeductibleSpending.toFixed(2)}\n`;
            reportText += `Reimbursements / Non-Taxable: $${reimbursementIncome.toFixed(2)}\n`;
            reportText += `Business Income: $${businessIncome.toFixed(2)}\n`;
            reportText += `Deductible Business Expenses: $${totalDeductibleExpenses.toFixed(2)}\n`;
            reportText += `Estimated Net (Take-Home): $${finalTakeHome.toFixed(2)}\n`;

            reportText += `\n\n--- INCOME DETAILS ---\n`;
            (taxIncomeReportData || []).forEach(cat => {
                reportText += `${cat.name} - Total: $${cat.total.toFixed(2)}\n`;
                cat.tasks.forEach(task => {
                    const income = (((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0));
                    reportText += `  - ${new Date(task.openDate).toLocaleDateString()}: ${task.text} - $${income.toFixed(2)}\n`;
                });
            });

            reportText += `\n\n--- DEDUCTIBLE EXPENSE DETAILS ---\n`;
            taxReportData.forEach(cat => {
                reportText += `${cat.name} - Total: $${cat.total.toFixed(2)}\n`;
                cat.tasks.forEach(task => reportText += `  - ${new Date(task.openDate).toLocaleDateString()}: ${task.text} - $${Math.abs(task.transactionAmount || 0).toFixed(2)}\n`);
            });

            if (w2DataForYear && totalWithheld > 0) {
                reportText += `\n\n--- W-2 TAX WITHHELD DETAILS ---\n`;
                if (w2DataForYear.federalWithholding > 0) reportText += `Federal Tax Withheld: $${w2DataForYear.federalWithholding.toFixed(2)}\n`;
                if (w2DataForYear.socialSecurityWithholding > 0) reportText += `Social Security Tax Withheld: $${w2DataForYear.socialSecurityWithholding.toFixed(2)}\n`;
                if (w2DataForYear.medicareWithholding > 0) reportText += `Medicare Tax Withheld: $${w2DataForYear.medicareWithholding.toFixed(2)}\n`;
            }

            navigator.clipboard.writeText(reportText).then(() => showToast('Report copied as text!'));
        };

        return (
            <div className="tax-year-report">
                <div className="tax-report-main-header">
                    {w2DataForYear?.employerName && (
                        <div className="tax-report-employer-info">
                            <div><strong>Employer:</strong> {w2DataForYear.employerName}</div>
                            {w2DataForYear.employerEin && <div><strong>EIN:</strong> {w2DataForYear.employerEin}</div>}
                            {w2DataForYear.employerAddress && <div><strong>Address:</strong> {w2DataForYear.employerAddress.replace(/\n/g, ', ')}</div>}
                        </div>
                    )}
                    {w2DataForYear?.employeeName && (
                        <div className="tax-report-employee-info">
                            <div><strong>Employee:</strong> {w2DataForYear.employeeName}</div>
                            {w2DataForYear.employeeAddress && <div><strong>Address:</strong> {w2DataForYear.employeeAddress.replace(/\n/g, ', ')}</div>}
                        </div>
                    )}
                    <h4>Tax Report for {selectedTaxYear}</h4>
                    {w2DataForYear?.taxpayerPin && (
                        <div className="tax-report-pin">
                            <strong>Taxpayer PIN:</strong> {w2DataForYear.taxpayerPin}
                        </div>
                    )}
                    <SimpleAccordion title="View Full Summary" startOpen={true} className="tax-report-summary-accordion">
                        <div className="tax-report-summary-stack">
                            <SimpleAccordion
                                className="summary-block-accordion"
                                title={
                                    <div className="summary-item stacked">
                                        <span className="summary-label">Total Income</span>
                                        <span className="summary-value income">
                                            ${totalIncome.toFixed(2)}
                                            <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(totalIncome.toFixed(2)); showToast('Copied!'); }}>
                                                <i className="fas fa-copy"></i>
                                            </button>
                                        </span>
                                    </div>
                                }
                            >
                                <div className="tax-withheld-breakdown">
                                    {(taxIncomeReportData || []).map(cat => (
                                        <span key={cat.name}>{cat.name}: <strong>${cat.total.toFixed(2)}</strong></span>
                                    ))}
                                </div>
                            </SimpleAccordion>

                            {totalWithheld > 0 && (
                                <SimpleAccordion
                                    className="summary-block-accordion"
                                    title={
                                        <div className="summary-item stacked">
                                            <span className="summary-label">Total W-2 Taxes Withheld</span>
                                            <span className="summary-value expense">
                                                ${totalWithheld.toFixed(2)}
                                                <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(totalWithheld.toFixed(2)); showToast('Copied!'); }}>
                                                    <i className="fas fa-copy"></i>
                                                </button>
                                            </span>
                                        </div>
                                    }
                                >
                                    <div className="tax-withheld-breakdown">
                                        {w2DataForYear.federalWithholding > 0 && <span>Federal: <strong>${w2DataForYear.federalWithholding.toFixed(2)}</strong></span>}
                                        {w2DataForYear.socialSecurityWithholding > 0 && <span>Social Security: <strong>${w2DataForYear.socialSecurityWithholding.toFixed(2)}</strong></span>}
                                        {w2DataForYear.medicareWithholding > 0 && <span>Medicare: <strong>${w2DataForYear.medicareWithholding.toFixed(2)}</strong></span>}
                                    </div>
                                </SimpleAccordion>
                            )}

                            <SimpleAccordion
                                className="summary-block-accordion"
                                title={
                                    <div className="summary-item stacked">
                                        <span className="summary-label">Total Deductible Business (1099) Expenses</span>
                                        <span className="summary-value expense">
                                            ${totalDeductibleExpenses.toFixed(2)}
                                            <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(totalDeductibleExpenses.toFixed(2)); showToast('Copied!'); }}>
                                                <i className="fas fa-copy"></i>
                                            </button>
                                        </span>
                                    </div>
                                }
                            >
                                <div className="tax-withheld-breakdown">
                                    {taxReportData.map(cat => (
                                        <span key={cat.name}>{cat.name}: <strong>${cat.total.toFixed(2)}</strong></span>
                                    ))}
                                </div>
                            </SimpleAccordion>

                            <div className="summary-block final-net-block">
                                {w2DataForYear?.wages > 0 && (<>
                                    <div className="summary-item stacked">
                                        <span className="summary-label">W2 Wages</span>
                                        <span className="summary-value income">
                                            ${(w2DataForYear.wages).toFixed(2)}
                                            <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText((w2DataForYear.wages).toFixed(2)); showToast('Copied!'); }}>
                                                <i className="fas fa-copy"></i>
                                            </button>
                                        </span>
                                    </div>
                                    {totalWithheld > 0 && (
                                        <div className="summary-item stacked">
                                            <span className="summary-label">W-2 Taxes Withheld</span>
                                            <span className="summary-value expense">
                                                ${totalWithheld.toFixed(2)}
                                                <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(totalWithheld.toFixed(2)); showToast('Copied!'); }}>
                                                    <i className="fas fa-copy"></i>
                                                </button>
                                            </span>
                                        </div>
                                    )}
                                </>)}
                                <div className="summary-item stacked">
                                    <span className="summary-label">Non-Deductible Spending</span>
                                    <span className="summary-value expense">
                                        ${nonDeductibleSpending.toFixed(2)}
                                        <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(nonDeductibleSpending.toFixed(2)); showToast('Copied!'); }}>
                                            <i className="fas fa-copy"></i>
                                        </button>
                                    </span>
                                </div>
                                <div className="summary-item stacked">
                                    <span className="summary-label">Reimbursements / Non-Taxable</span>
                                    <span className="summary-value income">
                                        ${reimbursementIncome.toFixed(2)}
                                        <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(reimbursementIncome.toFixed(2)); showToast('Copied!'); }}>
                                            <i className="fas fa-copy"></i>
                                        </button>
                                    </span>
                                </div>
                                <div className="summary-item stacked">
                                    <span className="summary-label">Business Income</span>
                                    <span className="summary-value income">
                                        ${businessIncome.toFixed(2)}
                                        <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(businessIncome.toFixed(2)); showToast('Copied!'); }}>
                                            <i className="fas fa-copy"></i>
                                        </button>
                                    </span>
                                </div>
                                <div className="summary-item stacked">
                                    <span className="summary-label">Deductible Business Expenses</span>
                                    <span className="summary-value expense">
                                        ${totalDeductibleExpenses.toFixed(2)}
                                        <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(totalDeductibleExpenses.toFixed(2)); showToast('Copied!'); }}>
                                            <i className="fas fa-copy"></i>
                                        </button>
                                    </span>
                                </div>
                                <div className="summary-item stacked summary-final-item">
                                    <span className="summary-label">Estimated Net (Take-Home)</span>
                                    <span className={`summary-value ${finalTakeHome >= 0 ? 'income' : 'expense'}`}>
                                        ${finalTakeHome.toFixed(2)}
                                        <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(finalTakeHome.toFixed(2)); showToast('Copied!'); }}>
                                            <i className="fas fa-copy"></i>
                                        </button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </SimpleAccordion>
                    <div className="tax-report-actions">
                        <button onClick={handleCopySimplifiedReportAsText} className="print-pdf-btn" style={{ backgroundColor: '#16a085' }}><i className="fas fa-clipboard-list"></i> Copy Summary</button>
                        <button onClick={handleCopyReportAsText} className="print-pdf-btn" style={{ backgroundColor: '#3498db' }}><i className="fas fa-copy"></i> Copy Full Text</button>
                        <button onClick={() => window.electronAPI.printToPdf({ year: selectedTaxYear })} className="print-pdf-btn"><i className="fas fa-file-pdf"></i> Print to PDF</button>
                        <button onClick={() => setSettings(prev => ({ ...prev, selectedReportYear: null }))} className="back-to-summary-btn"><i className="fas fa-arrow-left"></i> Back to Summary</button>
                    </div>
                </div>

                {/* W2 Details Accordion */}
                {w2DataForYear && (
                    <SimpleAccordion className="tax-category-accordion" title={<h4 className="tax-section-title">W-2 Details</h4>}>
                        <div className="tax-report-category-section">
                            {/* W-2 Wages */}
                            {(taxIncomeReportData || []).filter(cat => cat.name === 'W-2 Wages').map(category => (
                                <SimpleAccordion key={category.name} className="summary-block-accordion" title={<h5>{category.name} <span className="income-text">${category.total.toFixed(2)}</span></h5>}>
                                    <div className="tax-report-table-container">
                                        <table className="report-table">
                                            <thead><tr><th>Date</th><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                                            <tbody>
                                                {category.tasks.sort((a: Task, b: Task) => a.openDate - b.openDate).map((task: Task) => (
                                                    <tr key={task.id} onClick={() => navigateToTask(task.id)} className="clickable-row">
                                                        <td>{new Date(task.openDate).toLocaleDateString()}</td>
                                                        <td>{task.text}</td>
                                                        <td className="amount-column income-text">${(((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0)).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </SimpleAccordion>
                            ))}
                            {/* W-2 Tax Withheld Details */}
                            {(w2DataForYear.federalWithholding > 0 || w2DataForYear.socialSecurityWithholding > 0 || w2DataForYear.medicareWithholding > 0) && (
                                <SimpleAccordion className="summary-block-accordion" title={<h5>W-2 Tax Withheld Details<span className="expense-text">${totalWithheld.toFixed(2)}</span></h5>}>
                                    <div className="tax-report-table-container">
                                        <table className="report-table">
                                            <thead><tr><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                                            <tbody>
                                                {w2DataForYear.federalWithholding > 0 && <tr><td>Federal Tax Withheld</td><td className="amount-column expense-text">${w2DataForYear.federalWithholding.toFixed(2)}</td></tr>}
                                                {w2DataForYear.socialSecurityWithholding > 0 && <tr><td>Social Security Tax Withheld</td><td className="amount-column expense-text">${w2DataForYear.socialSecurityWithholding.toFixed(2)}</td></tr>}
                                                {w2DataForYear.medicareWithholding > 0 && <tr><td>Medicare Tax Withheld</td><td className="amount-column expense-text">${w2DataForYear.medicareWithholding.toFixed(2)}</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </SimpleAccordion>
                            )}
                        </div>
                    </SimpleAccordion>
                )}

                {/* Business Details Accordion */}
                <SimpleAccordion className="tax-category-accordion" title={<h4 className="tax-section-title">Business Details</h4>}>
                    <div className="tax-report-category-section">
                        {/* Business Revenue */}
                        {(taxIncomeReportData || []).filter(cat => cat.name === 'Business Income (1099)').map(category => (
                            <SimpleAccordion key={category.name} className="summary-block-accordion" title={<h5>Business Revenue <span className="income-text">${category.total.toFixed(2)}</span></h5>}>
                                <div className="tax-report-table-container">
                                    <table className="report-table">
                                        <thead><tr><th>Date</th><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                                        <tbody>
                                            {category.tasks.sort((a: Task, b: Task) => a.openDate - b.openDate).map((task: Task) => (
                                                <tr key={task.id} onClick={() => navigateToTask(task.id)} className="clickable-row">
                                                    <td>{new Date(task.openDate).toLocaleDateString()}</td>
                                                    <td>{task.text}</td>
                                                    <td className="amount-column income-text">${(((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0)).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </SimpleAccordion>
                        ))}

                        {/* Deductible Expense Details */}
                        <SimpleAccordion className="summary-block-accordion" title={<h5>Deductible Expense Details <span className="expense-text">${totalDeductibleExpenses.toFixed(2)}</span></h5>}>
                            <div className="tax-report-category-section">
                                {taxReportData.map(category => (
                                    <SimpleAccordion key={category.name} className="summary-block-accordion" title={<h6>{category.name} <span className="expense-text">${category.total.toFixed(2)}</span></h6>}>
                                        <div className="tax-report-table-container">
                                            <table className="report-table">
                                                <thead><tr><th>Date</th><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                                                <tbody>
                                                    {category.tasks.sort((a: Task, b: Task) => a.openDate - b.openDate).map((task: Task) => {
                                                        const transactionCategory = settings.categories.find(c => c.id === task.categoryId);
                                                        const taxCategory = settings.taxCategories?.find(tc => tc.id === task.taxCategoryId);
                                                        const percentageValue = transactionCategory?.deductiblePercentage ?? taxCategory?.deductiblePercentage ?? 100;
                                                        const deductibleAmount = (Math.abs(task.transactionAmount || 0) * (percentageValue / 100));
                                                        return (
                                                            <tr key={task.id} onClick={() => navigateToTask(task.id)} className="clickable-row">
                                                                <td>{new Date(task.openDate).toLocaleDateString()}</td>
                                                                <td>{task.text}</td>
                                                                <td className="amount-column expense-text">{percentageValue < 100 ? (<span title={`Original: $${Math.abs(task.transactionAmount || 0).toFixed(2)}`}>${deductibleAmount.toFixed(2)} <span className="deductible-percentage">({percentageValue}%)</span></span>) : (`$${Math.abs(task.transactionAmount || 0).toFixed(2)}`)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </SimpleAccordion>
                                ))}
                            </div>
                        </SimpleAccordion>

                        {/* Vehicle Expenses */}
                        {totalVehicleDeduction > 0 && (
                            <SimpleAccordion className="summary-block-accordion" title={<h5>Vehicle Expenses <span className="expense-text">${totalVehicleDeduction.toFixed(2)}</span></h5>}>
                                <div className="tax-report-table-container">
                                    <table className="report-table">
                                        <thead><tr><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                                        <tbody>
                                            {standardMileageDeduction > 0 && <tr><td>Standard Mileage Deduction ({settings.vehicleBusinessMiles} miles)</td><td className="amount-column expense-text">${standardMileageDeduction.toFixed(2)}</td></tr>}
                                            {(settings.vehicleParkingTollsAmount || 0) > 0 && <tr><td>Business Parking Fees/Tolls</td><td className="amount-column expense-text">${(settings.vehicleParkingTollsAmount || 0).toFixed(2)}</td></tr>}
                                            {(settings.vehiclePropertyTaxesAmount || 0) > 0 && <tr><td>Property Taxes Paid</td><td className="amount-column expense-text">${(settings.vehiclePropertyTaxesAmount || 0).toFixed(2)}</td></tr>}
                                            {(settings.vehicleLoanInterestAmount || 0) > 0 && <tr><td>Car Loan Interest Paid</td><td className="amount-column expense-text">${(settings.vehicleLoanInterestAmount || 0).toFixed(2)}</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </SimpleAccordion>
                        )}

                        {/* Depreciable Assets */}
                        {(settings.depreciableAssets && settings.depreciableAssets.length > 0) && (
                            <SimpleAccordion className="summary-block-accordion" title={<h5>Depreciable Assets <span className="expense-text">${totalCurrentYearDepreciation.toFixed(2)}</span></h5>}>
                                <div className="tax-report-table-container">
                                    <table className="report-table">
                                        <thead><tr><th>Description</th><th>Date Acquired</th><th className="amount-column">Cost</th><th className="amount-column">Business Use %</th></tr></thead>
                                        <tbody>
                                            {(settings.depreciableAssets || []).map(asset => (<React.Fragment key={asset.id}><tr><td>{asset.description}</td><td>{new Date(asset.dateAcquired).toLocaleDateString()}</td><td className="amount-column">${asset.cost.toFixed(2)}</td><td className="amount-column">{asset.businessUsePercentage || 100}%</td></tr><tr><td colSpan={4}><AssetDepreciationSchedule asset={asset} settings={settings} /></td></tr></React.Fragment>))}
                                            <tr className="report-table-footer"><td colSpan={2} style={{ textAlign: 'right' }}><strong>Total Asset Cost:</strong></td><td className="amount-column"><strong>${(settings.depreciableAssets || []).reduce((sum, asset) => sum + asset.cost, 0).toFixed(2)}</strong></td><td></td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </SimpleAccordion>
                        )}

                        {/* Business Gross Summary */}
                        <div className="summary-block final-net-block" style={{ marginTop: '20px' }}>
                            <div className="summary-item stacked"><span className="summary-label">Total Business Revenue</span><span className="summary-value income">${businessIncome.toFixed(2)}</span></div>
                            <div className="summary-item stacked"><span className="summary-label">Total Business Expenses</span><span className="summary-value expense">${(totalDeductibleExpenses + totalVehicleDeduction + totalCurrentYearDepreciation).toFixed(2)}</span></div>
                            <div className="summary-item stacked summary-final-item"><span className="summary-label">Estimated Business Gross</span><span className={`summary-value ${businessIncome - (totalDeductibleExpenses + totalVehicleDeduction + totalCurrentYearDepreciation) >= 0 ? 'income' : 'expense'}`}>${(businessIncome - (totalDeductibleExpenses + totalVehicleDeduction + totalCurrentYearDepreciation)).toFixed(2)}</span></div>
                        </div>
                    </div>
                </SimpleAccordion>

                {/* Other Details Accordion */}
                <SimpleAccordion className="tax-category-accordion" title={<h4 className="tax-section-title">Other Details</h4>}>
                    <div className="tax-report-category-section">
                        {/* Reimbursements */}
                        {(taxIncomeReportData || []).filter(cat => cat.name === 'Reimbursements').map(category => (
                            <SimpleAccordion key={category.name} className="summary-block-accordion" title={<h5>Reimbursements / Non-Taxable <span className="income-text">${category.total.toFixed(2)}</span></h5>}>
                                <div className="tax-report-table-container">
                                    <table className="report-table">
                                        <thead><tr><th>Date</th><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                                        <tbody>
                                            {category.tasks.sort((a: Task, b: Task) => a.openDate - b.openDate).map((task: Task) => (
                                                <tr key={task.id} onClick={() => navigateToTask(task.id)} className="clickable-row">
                                                    <td>{new Date(task.openDate).toLocaleDateString()}</td>
                                                    <td>{task.text}</td>
                                                    <td className="amount-column income-text">${(((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0)).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </SimpleAccordion>
                        ))}

                        {/* Charitable Donations */}
                        {(() => {
                            if (!taxReportData) return null;
                            const allYearExpenses = [...tasks, ...completedTasks].filter(task => new Date(task.openDate).getFullYear() === selectedTaxYear && task.transactionType === 'expense');
                            const charitableDonations = allYearExpenses.filter(task => task.taxCategoryId && settings.taxCategories?.find(tc => tc.id === task.taxCategoryId)?.name.toLowerCase().includes('charitable')).reduce((acc, task) => { acc.total += Math.abs(task.transactionAmount || 0); acc.tasks.push(task); return acc; }, { total: 0, tasks: [] as Task[] });
                            if (!charitableDonations || charitableDonations.total === 0) return null;
                            return (
                                <SimpleAccordion className="summary-block-accordion" title={<h5>Charitable Donations - Total: <span className="expense-text">${charitableDonations.total.toFixed(2)}</span></h5>}>
                                    <div className="tax-report-table-container">
                                        <table className="report-table">
                                            <thead><tr><th>Date</th><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                                            <tbody>
                                                {charitableDonations.tasks.sort((a, b) => a.openDate - b.openDate).map(task => (
                                                    <tr key={task.id} onClick={() => navigateToTask(task.id)} className="clickable-row">
                                                        <td>{new Date(task.openDate).toLocaleDateString()}</td>
                                                        <td>{task.text}</td>
                                                        <td className="amount-column expense-text">${Math.abs(task.transactionAmount || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </SimpleAccordion>
                            );
                        })()}
                    </div>
                </SimpleAccordion>
            </div>
        );
    };

    const renderSummaryView = () => (
        <>
            <div className="report-section-header">
                <h3>Income Summary</h3>
            </div>
            {incomeByType.map(group => (
                <SimpleAccordion key={group.name} className="tax-category-accordion" title={
                    <div className="tax-accordion-title">
                        <span>{group.name}</span>
                        <span className="tax-accordion-total income-text">${group.total.toFixed(2)}</span>
                    </div>
                }>
                    <table className="report-table">
                        <thead><tr><th>Date</th><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                        <tbody>
                            {group.tasks.sort((a: Task, b: Task) => a.openDate - b.openDate).map((task: Task) => (
                                <tr key={task.id}>
                                    <td>{new Date(task.openDate).toLocaleDateString()}</td>
                                    <td>{task.text}</td>
                                    <td className="amount-column income-text">${(((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </SimpleAccordion>
            ))}
            <div className="report-section-header">
                <h3>Tax-Deductible Expenses</h3>
            </div>
            {Array.from(transactionsByTaxCategory.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([categoryId, group]) => (
                <SimpleAccordion key={categoryId} className="tax-category-accordion" title={
                    <div className="tax-accordion-title">
                        <span>{group.name}</span>
                        <span className="tax-accordion-total expense-text">${group.total.toFixed(2)}</span>
                    </div>
                }>
                    <table className="report-table">
                        <thead><tr><th>Date</th><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                        <tbody>
                            {group.tasks.sort((a: Task, b: Task) => a.openDate - b.openDate).map((task: Task) => (
                                <tr key={task.id}><td>{new Date(task.openDate).toLocaleDateString()}</td><td>{task.text}</td><td className="amount-column expense-text">${Math.abs(task.transactionAmount || 0).toFixed(2)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </SimpleAccordion>
            ))}
        </>
    );

    return (
        <div className="report-section">
            <div className="report-section-header">
                <h3>Tax Report</h3>
                <div className="tax-report-year-selector">
                    <label>View Report for:</label>
                    <select onChange={(e) => setSettings(prev => ({ ...prev, selectedReportYear: e.target.value ? Number(e.target.value) : null }))} value={selectedTaxYear || ''}>
                        <option value="">-- Select Year --</option>
                        {[...new Set([...tasks, ...completedTasks].map(t => new Date(t.openDate).getFullYear()))]
                            .sort((a, b) => b - a)
                            .map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
            </div>
            {selectedTaxYear && taxReportData ? renderYearlyReport() : renderSummaryView()}
        </div>
    );
};