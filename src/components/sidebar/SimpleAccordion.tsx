import React, { useState, useEffect } from 'react';
import { AccordionProps } from '../../types';
import '../styles/Accordion.css';

export function SimpleAccordion({ title, children, startOpen = false, isOpen: controlledIsOpen, onToggle, className }: AccordionProps & { startOpen?: boolean, isOpen?: boolean, onToggle?: (isOpen: boolean) => void, className?: string }) {
    const [internalIsOpen, setInternalIsOpen] = useState(startOpen);

    // Determine if the component is controlled or uncontrolled
    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    useEffect(() => {
        // This effect should only apply to the uncontrolled state
        if (!isControlled) {
            setInternalIsOpen(startOpen);
        }
    }, [startOpen, isControlled]);

    return (
        <div className={`accordion ${className || ''}`}>
            <div className="accordion-header" onClick={(e) => {
                e.stopPropagation();
                if (isControlled) {
                    // If controlled, notify the parent to toggle its state.
                    if (onToggle) onToggle(!isOpen);
                } else {
                    // If uncontrolled, just toggle the internal state.
                    setInternalIsOpen(!isOpen);
                }
            }}>
                {typeof title === 'string' ? <h4>{title}</h4> : <div className="accordion-title-wrapper">{title}</div>}
                <span className="accordion-icon">
                    <i className={`fas ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                </span>
            </div>
            <div className={`accordion-content ${isOpen ? 'open' : 'closed'}`}>
                {isOpen && children}
            </div>
        </div>
    );
}