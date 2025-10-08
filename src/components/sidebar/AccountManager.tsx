import React, { useState, useRef } from 'react';
import { Account } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { SimpleAccordion } from '../sidebar/SimpleAccordion';

export function AccountManager() {
    const { settings, setSettings } = useAppContext();
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
    const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleAddAccount = () => {
        const newAccount: Account = { id: Date.now(), name: 'New Account' };
        setSettings(prev => ({ ...prev, accounts: [...prev.accounts, newAccount] }));
    };

    const handleUpdateAccount = (id: number, name: string) => {
        setSettings(prev => ({
            ...prev,
            accounts: prev.accounts.map(acc => acc.id === id ? { ...acc, name } : acc)
        }));
    };

    const handleDeleteAccount = (id: number) => {
        if (confirmingDeleteId === id) {
            setSettings(prev => ({ ...prev, accounts: prev.accounts.filter(acc => acc.id !== id) }));
            setConfirmingDeleteId(null);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        } else {
            setConfirmingDeleteId(id);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteId(null), 3000);
        }
    };

    return (
        <SimpleAccordion title="Account Manager">
            <div className="category-manager-list">
                {settings.accounts.map(account => (
                    <div key={account.id} className="category-manager-item">
                        <input type="text" defaultValue={account.name} onBlur={(e) => handleUpdateAccount(account.id, e.target.value)} />
                        <button className={`remove-link-btn ${confirmingDeleteId === account.id ? 'confirm-delete' : ''}`} onClick={() => handleDeleteAccount(account.id)}>
                            <i className={`fas ${confirmingDeleteId === account.id ? 'fa-check' : 'fa-minus'}`}></i>
                        </button>
                    </div>
                ))}
            </div>
            <button className="add-link-btn" onClick={handleAddAccount}><i className="fas fa-plus"></i> Add Account</button>
        </SimpleAccordion>
    );
}