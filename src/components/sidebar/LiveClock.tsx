import React, { useState, useEffect } from 'react';

export function LiveClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="live-clock">{time.toLocaleString()}</div>
    );
}