import React, { useState, useEffect } from 'react';
import { AccordionProps } from '../../types';
import '../styles/Accordion.css';

export function SimpleAccordion({ title, children, startOpen = false, onToggle, className }: AccordionProps & { startOpen?: boolean, onToggle?: (isOpen: boolean) => void, className?: string }) {
    const [isOpen, setIsOpen] = useState(startOpen);

    useEffect(() => {
        setIsOpen(startOpen);
    }, [startOpen]);

    return (
        <div className={`accordion ${className || ''}`}>
            <div className="accordion-header" onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
                if (onToggle) onToggle(!isOpen);
            }}>
                {typeof title === 'string' ? <h4>{title}</h4> : <div className="accordion-title-wrapper">{title}</div>}
                <span className="accordion-icon">
                    <i className={`fas ${isOpen ? 'fa-minus' : 'fa-plus'}`}></i>
                </span>
            </div>
            <div className={`accordion-content ${isOpen ? 'open' : 'closed'}`}>
                {isOpen && children}
            </div>
        </div>
    );
}