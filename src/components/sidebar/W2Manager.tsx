import React, { useMemo } from 'react';
import { W2Data } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { SimpleAccordion } from '../sidebar/SimpleAccordion';

export function W2Manager() {
    const { settings, setSettings } = useAppContext();
    const selectedYear = settings.w2ManagerSelectedYear || new Date().getFullYear();

    const currentW2Data = useMemo(() => {
        return settings.w2Data?.[selectedYear] || {
            wages: 0,
            federalWithholding: 0,
            socialSecurityWithholding: 0,
            medicareWithholding: 0,
            taxpayerPin: '',
            employerEin: '',
            employerName: '',
            employerAddress: '',
            employeeName: '',
            employeeAddress: '',
        };
    }, [settings.w2Data, selectedYear]);

    const handleW2DataChange = (field: keyof W2Data, value: string) => {
        // For string fields, just use the value. For number fields, parse it.
        const isNumericField = ['wages', 'federalWithholding', 'socialSecurityWithholding', 'medicareWithholding'].includes(field);
        const updatedValue = isNumericField ? parseFloat(value) || 0 : value;

        const updatedW2Data = { ...currentW2Data, [field]: updatedValue };

        setSettings(prev => ({
            ...prev,
            w2Data: {
                ...(prev.w2Data || {}),
                [selectedYear]: updatedW2Data,
            }
        }));
    };

    const yearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear; i >= currentYear - 5; i--) {
            years.push(i);
        }
        return years.map(year => <option key={year} value={year}>{year}</option>);
    };

    return (
        <SimpleAccordion title="W-2 Manager">
            <div className="w2-manager-container">
                <label>
                    Tax Year:
                    <select value={selectedYear} onChange={(e) => setSettings(prev => ({ ...prev, w2ManagerSelectedYear: Number(e.target.value) }))}>
                        {yearOptions()}
                    </select>
                </label>
                <div className="w2-input-group">
                    <h5 className="w2-section-header">Employer Information</h5>
                    <label>Employer Identification Number (EIN)</label>
                    <input type="text" placeholder="e.g., 12-3456789" value={currentW2Data.employerEin || ''} onChange={(e) => handleW2DataChange('employerEin', e.target.value)} />
                    <label>Employer Name</label>
                    <input type="text" placeholder="Company Name" value={currentW2Data.employerName || ''} onChange={(e) => handleW2DataChange('employerName', e.target.value)} />
                    <label>Employer Address</label>
                    <textarea placeholder="Street, City, State, ZIP" value={currentW2Data.employerAddress || ''} onChange={(e) => handleW2DataChange('employerAddress', e.target.value)} rows={3} />

                    <h5 className="w2-section-header">Employee Information</h5>
                    <label>Employee Name</label>
                    <input type="text" placeholder="Your Name" value={currentW2Data.employeeName || ''} onChange={(e) => handleW2DataChange('employeeName', e.target.value)} />
                    <label>Employee Address</label>
                    <textarea placeholder="Your Street, City, State, ZIP" value={currentW2Data.employeeAddress || ''} onChange={(e) => handleW2DataChange('employeeAddress', e.target.value)} rows={3} />
                    <label>Wages, Tips, Other Comp (Box 1)</label>
                    <input type="number" placeholder="0.00" value={currentW2Data.wages || ''} onChange={(e) => handleW2DataChange('wages', e.target.value)} />
                    <label>Federal Tax Withheld (Box 2)</label>
                    <input type="number" placeholder="0.00" value={currentW2Data.federalWithholding || ''} onChange={(e) => handleW2DataChange('federalWithholding', e.target.value)} />
                    <label>Social Security Tax Withheld (Box 4)</label>
                    <input type="number" placeholder="0.00" value={currentW2Data.socialSecurityWithholding || ''} onChange={(e) => handleW2DataChange('socialSecurityWithholding', e.target.value)} />
                    <label>Medicare Tax Withheld (Box 6)</label>
                    <input type="number" placeholder="0.00" value={currentW2Data.medicareWithholding || ''} onChange={(e) => handleW2DataChange('medicareWithholding', e.target.value)} />
                    <label>Taxpayer PIN</label>
                    <input type="text" placeholder="Enter PIN" value={currentW2Data.taxpayerPin || ''} onChange={(e) => handleW2DataChange('taxpayerPin', e.target.value)} />
                </div>
            </div>
        </SimpleAccordion>
    );
}