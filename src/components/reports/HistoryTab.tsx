import React from 'react';
import { Task, Category } from '../../types';
import { formatTime, formatTimestamp } from '../../utils';

interface HistoryTabProps {
    historyCount: number;
    setHistoryCount: (count: number) => void;
    sortedFilteredTasks: Task[];
    categories: Category[];
    showToast: (message: string) => void;
    requestSort: (key: keyof Task | 'earnings' | 'categoryName' | 'completionDate') => void;
    getSortIndicator: (key: keyof Task | 'earnings' | 'categoryName' | 'completionDate') => string | null;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
    historyCount,
    setHistoryCount,
    sortedFilteredTasks,
    categories,
    showToast,
    requestSort,
    getSortIndicator,
}) => {
    return (
        <div className="report-section">
            <div className="report-section-header">
                <h3>Recent Task History</h3>
                <label className="history-count-control">
                    Show:
                    <input type="number" value={historyCount} onChange={(e) => setHistoryCount(Number(e.target.value))} min="1" />
                    most recent
                </label>
            </div>
            <table className="report-table">
                <thead>
                    <tr>
                        <th>Task Name</th>
                        <th onClick={() => requestSort('categoryName')}>Category{getSortIndicator('categoryName')}</th>
                        <th>Completion Date</th>
                        <th onClick={() => requestSort('manualTime')}>Time Tracked{getSortIndicator('manualTime')}</th>
                        <th onClick={() => requestSort('earnings')}>Earnings{getSortIndicator('earnings')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedFilteredTasks.slice(0, historyCount).map(task => {
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
                                        }}>
                                            <i className="fas fa-copy"></i>
                                        </button>
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
    );
};