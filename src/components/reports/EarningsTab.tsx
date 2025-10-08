import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ChartData {
    name?: string;
    date?: string;
    value?: number;
    earnings?: number;
    [key: string]: any; // Add index signature to allow for other properties
}

interface EarningsTabProps {
    pieChartData: ChartData[];
    lineChartData: ChartData[];
    renderCustomizedLabel: (props: any) => JSX.Element;
}

export const EarningsTab: React.FC<EarningsTabProps> = ({ pieChartData, lineChartData, renderCustomizedLabel }) => {
    return (
        <>
            <div className="report-section">
                <h3>Earnings by Category</h3>
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
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="report-section">
                <h3>Earnings Over Time</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']} labelFormatter={(label: string) => new Date(label).toLocaleDateString()} />
                            <Legend />
                            <Line type="monotone" dataKey="earnings" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
};