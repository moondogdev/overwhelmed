import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Task, Category, Settings } from '../../types';

interface FinancialSummary {
    totalIncome: number;
    totalExpenses: number;
    totalTransfers: number;
    netProfit: number;
}

interface IncomeExpenseData {
    name: string;
    value: number;
    [key: string]: any;
}

interface CashFlowData {
    date: string;
    income: number;
    expenses: number;
    net: number;
}

interface SummaryByAccount {
    name: string;
    totalIn: number;
    totalOut: number;
    net: number;
}

interface MileageCalculation {
    totalSpentOnGas: number;
    gasPricePerGallon: number;
    gasMpgLow: number;
    gasMpgHigh: number;
    milesLow: number;
    milesHigh: number;
    gasCategoryName: string;
}

interface TransferSummary {
    sent: number;
    received: number;
    net: number;
}

interface TransfersByCategory {
    name: string;
    sent: number;
    received: number;
    net: number;
}

interface TaxCategorizedExpenseSummary {
    name: string;
    total: number;
    count: number;
}

interface FinancesTabProps {
    financialSummary: FinancialSummary;
    incomeExpenseData: IncomeExpenseData[];
    renderCustomizedLabel: (props: any) => JSX.Element;
    PIE_CHART_COLORS: string[];
    cashFlowData: CashFlowData[];
    summaryByAccount: SummaryByAccount[];
    mileageCalculation: MileageCalculation | null;
    sortedTransferTransactions: Task[];
    transfersByCategory: TransfersByCategory[];
    requestTransactionSort: (key: keyof Task | 'categoryName' | 'transactionAmount') => void;
    getTransactionSortIndicator: (key: keyof Task | 'categoryName' | 'transactionAmount') => string | null;
    transferSummary: TransferSummary;
    taxCategorizedExpenses: TaxCategorizedExpenseSummary[];
    requestTaxSort: (key: 'name' | 'total' | 'count') => void;
    taxSortConfig: { key: 'name' | 'total' | 'count', direction: 'ascending' | 'descending' };
    sortedTransactions: Task[];
    categories: Category[];
    settings: Settings; // Needed for category names in tables
}

export const FinancesTab: React.FC<FinancesTabProps> = ({
    financialSummary,
    incomeExpenseData,
    renderCustomizedLabel,
    PIE_CHART_COLORS,
    cashFlowData,
    summaryByAccount,
    mileageCalculation,
    sortedTransferTransactions,
    transfersByCategory,
    requestTransactionSort,
    getTransactionSortIndicator,
    transferSummary,
    taxCategorizedExpenses,
    requestTaxSort,
    taxSortConfig,
    sortedTransactions,
    categories,
    settings,
}) => {
    return (
        <>
            <div className="report-section">
                <h3>Financial Summary (All Time)</h3>
                <div className="financial-details-grid">
                    <div className="financial-summary-grid">
                        <div className="summary-item">
                            <span className="summary-label">Total Income</span>
                            <span className="summary-value income">${financialSummary.totalIncome.toFixed(2)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Total Expenses</span>
                            <span className="summary-value expense">${financialSummary.totalExpenses.toFixed(2)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Total Transfers</span>
                            <span className="summary-value transfer">${financialSummary.totalTransfers.toFixed(2)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Net Profit</span>
                            <span className={`summary-value ${financialSummary.netProfit >= 0 ? 'income' : 'expense'}`}>${financialSummary.netProfit.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="financial-chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={incomeExpenseData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={100}
                                    isAnimationActive={false}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {incomeExpenseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <div className="report-section">
                <h3>Cash Flow Over Time</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={cashFlowData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) => `$${value.toFixed(2)}`}
                                labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="income" name="Income" stroke="#28a745" activeDot={{ r: 8 }} isAnimationActive={false} />
                            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#dc3545" activeDot={{ r: 8 }} isAnimationActive={false} />
                            <Line type="monotone" dataKey="net" name="Net" stroke="#61dafb" strokeWidth={2} activeDot={{ r: 8 }} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="report-section">
                <h3>Summary by Account</h3>
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Account</th>
                            <th className="amount-column">Total In</th>
                            <th className="amount-column">Total Out</th>
                            <th className="amount-column">Net Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryByAccount.map(summary => (
                            <tr key={summary.name}>
                                <td>{summary.name}</td>
                                <td className="amount-column income" title="Income + Incoming Transfers">
                                    {summary.totalIn > 0 ? `+$${summary.totalIn.toFixed(2)}` : '$0.00'}
                                </td>
                                <td className="amount-column expense" title="Expenses + Outgoing Transfers">
                                    {summary.totalOut > 0 ? `-$${summary.totalOut.toFixed(2)}` : '$0.00'}
                                </td>
                                <td className={`amount-column ${summary.net >= 0 ? 'income' : 'expense'}`}>
                                    {summary.net >= 0 ? '+' : '-'}${Math.abs(summary.net).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ borderTop: '2px solid #555' }}>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Grand Total:</td>
                            <td className="amount-column income">
                                +${summaryByAccount.reduce((sum, acc) => sum + acc.totalIn, 0).toFixed(2)}
                            </td>
                            <td className="amount-column expense">
                                -${summaryByAccount.reduce((sum, acc) => sum + acc.totalOut, 0).toFixed(2)}
                            </td>
                            <td className={`amount-column ${summaryByAccount.reduce((sum, acc) => sum + acc.net, 0) >= 0 ? 'income' : 'expense'}`}>
                                {summaryByAccount.reduce((sum, acc) => sum + acc.net, 0) >= 0 ? '+' : '-'}${Math.abs(summaryByAccount.reduce((sum, acc) => sum + acc.net, 0)).toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            {mileageCalculation && (
                <div className="report-section">
                    <h3>Vehicle Information & Mileage Estimate</h3>
                    <div className="mileage-summary">
                        <p>
                            The average mileage range for <strong>${mileageCalculation.totalSpentOnGas.toFixed(2)}</strong> spent on {mileageCalculation.gasCategoryName},
                            at <strong>${mileageCalculation.gasPricePerGallon.toFixed(2)}</strong> per gallon, with a vehicle getting between <strong>{mileageCalculation.gasMpgLow}</strong> and <strong>{mileageCalculation.gasMpgHigh}</strong> MPG is:
                        </p>
                        <div className="mileage-result">
                            <span>{mileageCalculation.milesLow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            <span className="to-text">to</span>
                            <span>{mileageCalculation.milesHigh.toLocaleString(undefined, { maximumFractionDigits: 0 })} miles</span>
                        </div>
                    </div>
                    <p className="report-footnote">
                        This is an estimate based on the transactions visible in the current report filter.
                        You can change the calculator settings in the sidebar.
                    </p>
                </div>
            )}
            {sortedTransferTransactions.length > 0 && (
                <div className="report-section">
                    <h3>Transfers by Category</h3>
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Category / Account</th>
                                <th className="amount-column">Total Sent</th>
                                <th className="amount-column">Total Received</th>
                                <th className="amount-column">Net Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfersByCategory.map(summary => (
                                <tr key={summary.name}>
                                    <td>{summary.name}</td>
                                    <td className="amount-column expense">
                                        {summary.sent > 0 ? `-$${summary.sent.toFixed(2)}` : '$0.00'}
                                    </td>
                                    <td className="amount-column income">
                                        {summary.received > 0 ? `+$${summary.received.toFixed(2)}` : '$0.00'}
                                    </td>
                                    <td className={`amount-column ${summary.net >= 0 ? 'income' : 'expense'}`}>
                                        {summary.net >= 0 ? '+' : '-'}${Math.abs(summary.net).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <h3>Transfer Details</h3>
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th onClick={() => requestTransactionSort('text')}>Task / Item{getTransactionSortIndicator('text')}</th>
                                <th onClick={() => requestTransactionSort('openDate')}>Date{getTransactionSortIndicator('openDate')}</th>
                                <th onClick={() => requestTransactionSort('categoryName')}>Category{getTransactionSortIndicator('categoryName')}</th>
                                <th onClick={() => requestTransactionSort('transactionAmount')} className="amount-column">Amount{getTransactionSortIndicator('transactionAmount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTransferTransactions.map(task => {
                                const category = categories.find(c => c.id === task.categoryId);
                                const categoryName = category?.name || 'Uncategorized';
                                const amount = task.transactionAmount || 0;
                                return (
                                    <tr key={task.id}>
                                        <td>{task.text}</td>
                                        <td>{new Date(task.openDate).toLocaleDateString()}</td>
                                        <td>{categoryName}</td>
                                        <td className={`amount-column ${amount >= 0 ? 'income' : 'expense'}`}>
                                            {amount >= 0 ? '+' : '-'}${Math.abs(amount).toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Sent:</td>
                                <td className="amount-column expense">-${transferSummary.sent.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Received:</td>
                                <td className="amount-column income">+${transferSummary.received.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #555' }}>Net Transfer:</td>
                                <td className={`amount-column ${transferSummary.net >= 0 ? 'income' : 'expense'}`} style={{ borderTop: '1px solid #555' }}>
                                    {transferSummary.net >= 0 ? '+' : '-'}${Math.abs(transferSummary.net).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
            {taxCategorizedExpenses.length > 0 && (
                <div className="report-section">
                    <h3>Deductible Expenses by Tax Category</h3>
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th onClick={() => requestTaxSort('name')}>
                                    Tax Category {taxSortConfig.key === 'name' && (taxSortConfig.direction === 'ascending' ? '▲' : '▼')}
                                </th>
                                <th className="amount-column" onClick={() => requestTaxSort('total')}>
                                    Total Expenses {taxSortConfig.key === 'total' && (taxSortConfig.direction === 'ascending' ? '▲' : '▼')}
                                </th>
                                <th className="amount-column" onClick={() => requestTaxSort('count')}>
                                    # of Transactions {taxSortConfig.key === 'count' && (taxSortConfig.direction === 'ascending' ? '▲' : '▼')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {taxCategorizedExpenses.map(summary => (
                                <tr key={summary.name}>
                                    <td>{summary.name}</td>
                                    <td className="amount-column expense-text">${summary.total.toFixed(2)}</td>
                                    <td className="amount-column">{summary.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="report-section">
                <h3>All Transactions</h3>
                <table className="report-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestTransactionSort('text')}>Task / Item{getTransactionSortIndicator('text')}</th>
                            <th onClick={() => requestTransactionSort('openDate')}>Date{getTransactionSortIndicator('openDate')}</th>
                            <th onClick={() => requestTransactionSort('categoryName')}>Category{getTransactionSortIndicator('categoryName')}</th>
                            <th onClick={() => requestTransactionSort('transactionAmount')} className="amount-column">Amount{getTransactionSortIndicator('transactionAmount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTransactions.map(task => {
                            const category = categories.find(c => c.id === task.categoryId);
                            const categoryName = category?.name || 'Uncategorized';
                            const amount = task.transactionAmount || 0;
                            return (
                                <tr key={task.id}>
                                    <td>{task.text}</td>
                                    <td>{new Date(task.openDate).toLocaleDateString()}</td>
                                    <td>{categoryName}</td>
                                    <td className={`amount-column ${amount > 0 ? 'income' : 'expense'}`}>
                                        {amount > 0 ? '+' : '-'}${Math.abs(amount).toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};