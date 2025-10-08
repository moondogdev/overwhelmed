import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatTime } from '../../utils';

interface SummaryTabProps {
    totalTasksCompleted: number;
    totalTimeTracked: number;
    totalEarnings: number;
    activityChartTitle: string;
    activityChartData: { date: string; count: number }[];
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
    totalTasksCompleted,
    totalTimeTracked,
    totalEarnings,
    activityChartTitle,
    activityChartData,
}) => {
    return (
        <>
            <div className="report-section">
                <h3>Overall Summary (Filtered)</h3>
                <p><strong>Total Tasks Completed:</strong> {totalTasksCompleted}</p>
                <p><strong>Total Time Tracked:</strong> {formatTime(totalTimeTracked)}</p>
                <p><strong>Total Earnings:</strong> ${totalEarnings.toFixed(2)}</p>
            </div>
            <div className="report-section">
                <h3>{activityChartTitle}</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={activityChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis allowDecimals={false} />
                            <Tooltip
                                formatter={(value: number) => [`${value} tasks`, 'Completed']}
                                labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                            />
                            <Legend />
                            <Bar dataKey="count" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
};