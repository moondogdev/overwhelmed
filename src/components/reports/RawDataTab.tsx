import React from 'react';
import { Task, Category } from '../../types';
import { formatTime, formatTimestamp } from '../../utils';

interface ChartData {
    name?: string;
    date?: string;
    count?: number;
}

interface RawDataTabProps {
    completionsByDayChartData: ChartData[];
    completionsByCategoryChartData: ChartData[];
    completionsByName: ChartData[];
    sortedFilteredTasks: Task[];
    categories: Category[];
    showToast: (message: string) => void;
    requestSort: (key: keyof Task | 'earnings' | 'categoryName' | 'completionDate') => void;
    getSortIndicator: (key: keyof Task | 'earnings' | 'categoryName' | 'completionDate') => string | null;
}

export const RawDataTab: React.FC<RawDataTabProps> = ({
    completionsByDayChartData,
    completionsByCategoryChartData,
    completionsByName,
    sortedFilteredTasks,
    categories,
    showToast,
    requestSort,
    getSortIndicator,
}) => {

    const handleCopyTable = () => {
        const header = ["Task Name", "Category", "Completion Date", "Time Tracked (HH:MM:SS)", "Earnings ($)"].join('\t');
        const rows = sortedFilteredTasks.map(task => {
            const category = categories.find(c => c.id === task.categoryId)?.name || 'Uncategorized';
            const completionTime = formatTimestamp(task.createdAt + (task.completedDuration || 0));
            const timeTracked = formatTime(task.manualTime || 0);
            const earnings = (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)).toFixed(2);
            return [task.text, category, completionTime, timeTracked, earnings].join('\t');
        });
        const tableText = [header, ...rows].join('\n');
        navigator.clipboard.writeText(tableText).then(() => {
            showToast('Table data copied!');
        });
    };

    return (
        <>
            <div className="report-section">
                <h3>Completions by Category</h3>
                <div className="chart-container">
                    {completionsByCategoryChartData.map(({ name, count }) => (
                        <div key={name} className="chart-bar-item">
                            <span className="chart-label">{name}</span>
                            <span className="chart-value">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="report-section">
                <h3>Most Completed Tasks</h3>
                <ul>
                    {completionsByName.map(({ name, count }) => (
                        <li key={name}>{name}: {count} time(s)</li>
                    ))}
                </ul>
            </div>

            <div className="report-section">
                <h3>Filtered Task Data</h3>
                <div className="report-section-actions">
                    <button onClick={handleCopyTable}>Copy Table</button>
                </div>
                <table className="report-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('text')}>Task Name{getSortIndicator('text')}</th>
                            <th onClick={() => requestSort('categoryName')}>Category{getSortIndicator('categoryName')}</th>
                            <th onClick={() => requestSort('completionDate')}>Completion Date{getSortIndicator('completionDate')}</th>
                            <th onClick={() => requestSort('manualTime')}>Time Tracked{getSortIndicator('manualTime')}</th>
                            <th onClick={() => requestSort('earnings')}>Earnings{getSortIndicator('earnings')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedFilteredTasks.map(task => {
                            const category = categories.find(c => c.id === task.categoryId);
                            const categoryName = category?.name || 'Uncategorized';
                            const completionTime = task.createdAt + (task.completedDuration || 0);
                            const earnings = (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0));
                            return (
                                <tr key={task.id}>
                                    <td>
                                        <span className="link-with-copy">
                                            {task.text}
                                            <button className="copy-btn" title="Copy Row Data" onClick={() => {
                                                const rowData = [task.text, categoryName, formatTimestamp(completionTime), formatTime(task.manualTime || 0), `$${earnings.toFixed(2)}`].join('\t');
                                                navigator.clipboard.writeText(rowData).then(() => showToast('Row data copied!'));
                                            }}><i className="fas fa-copy"></i></button>
                                        </span>
                                    </td>
                                    <td>{categoryName}</td>
                                    <td>{formatTimestamp(completionTime)}</td>
                                    <td>{formatTime(task.manualTime || 0)}</td>
                                    <td>${earnings.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};