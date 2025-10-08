import { useMemo, useEffect, useRef } from 'react';

interface UseSelectionManagementProps {
    visibleTaskIds: number[];
    selectedTaskIds: number[];
    setSelectedTaskIds: React.Dispatch<React.SetStateAction<number[]>>;
    visibleCompletedTaskIds: number[];
}

export function useSelectionManagement({
    visibleTaskIds,
    selectedTaskIds,
    setSelectedTaskIds,
    visibleCompletedTaskIds,
}: UseSelectionManagementProps) {
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
    const selectAllCompletedCheckboxRef = useRef<HTMLInputElement>(null);

    const allVisibleSelected = useMemo(() =>
        visibleTaskIds.length > 0 && visibleTaskIds.every(id => selectedTaskIds.includes(id)),
        [visibleTaskIds, selectedTaskIds]
    );

    const someVisibleSelected = useMemo(() =>
        visibleTaskIds.length > 0 && visibleTaskIds.some(id => selectedTaskIds.includes(id)),
        [visibleTaskIds, selectedTaskIds]
    );

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
        }
    }, [someVisibleSelected, allVisibleSelected]);

    const handleToggleSelectAll = () => {
        const visibleIdsSet = new Set(visibleTaskIds);
        setSelectedTaskIds(prev => allVisibleSelected ? prev.filter(id => !visibleIdsSet.has(id)) : [...new Set([...prev, ...visibleIdsSet])]);
    };

    const allCompletedVisibleSelected = useMemo(() =>
        visibleCompletedTaskIds.length > 0 && visibleCompletedTaskIds.every(id => selectedTaskIds.includes(id)),
        [visibleCompletedTaskIds, selectedTaskIds]
    );

    const someCompletedVisibleSelected = useMemo(() =>
        visibleCompletedTaskIds.length > 0 && visibleCompletedTaskIds.some(id => selectedTaskIds.includes(id)),
        [visibleCompletedTaskIds, selectedTaskIds]
    );

    useEffect(() => {
        if (selectAllCompletedCheckboxRef.current) {
            selectAllCompletedCheckboxRef.current.indeterminate = someCompletedVisibleSelected && !allCompletedVisibleSelected;
        }
    }, [someCompletedVisibleSelected, allCompletedVisibleSelected]);

    const handleToggleSelectAllCompleted = () => {
        const visibleIdsSet = new Set(visibleCompletedTaskIds);
        setSelectedTaskIds(prev => allCompletedVisibleSelected ? prev.filter(id => !visibleIdsSet.has(id)) : [...new Set([...prev, ...visibleIdsSet])]);
    };

    return {
        selectAllCheckboxRef,
        allVisibleSelected,
        someVisibleSelected,
        handleToggleSelectAll,
        selectAllCompletedCheckboxRef,
        allCompletedVisibleSelected,
        handleToggleSelectAllCompleted,
    };
}