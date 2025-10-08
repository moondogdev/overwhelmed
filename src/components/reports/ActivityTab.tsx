import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
    name?: string;
    value?: number;
    [key: string]: any; // Add index signature to allow for other properties
}

interface ActivityTabProps {
    pieChartData: ChartData[];
    renderCustomizedLabel: (props: any) => JSX.Element;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ pieChartData, renderCustomizedLabel }) => {
    return (
        <>
            <div className="report-section">
                <h3>Completed Tasks by Category</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={100}
                                fill="#82ca9d"
                                dataKey="value"
                            >
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45 + 120}, 60%, 50%)`} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `${value} tasks`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
};