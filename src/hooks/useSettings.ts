import { useState, useCallback, useRef, useEffect } from 'react';
import { Settings } from '../types';
import { defaultSettings } from '../config';

interface UseSettingsProps {
  showToast: (message: string, duration?: number) => void;
}

export function useSettings({ showToast }: UseSettingsProps) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const settingsRef = useRef(settings);

  // Keep the ref updated with the latest state
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const setActiveCategoryId = useCallback((id: number | 'all') => {
    // When changing a parent category, always reset the sub-category to 'all'
    setSettings(prev => ({ ...prev, activeCategoryId: id, activeSubCategoryId: 'all' }));
  }, []);

  const setActiveSubCategoryId = useCallback((id: number | 'all') => {
    setSettings(prev => ({ ...prev, activeSubCategoryId: id }));
  }, []);

  const applyDefaultShadow = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      shadowColor: "#000000",
      shadowBlur: 7,
      shadowOffsetX: 5,
      shadowOffsetY: 5,
    }));
  }, []);

  const resetShadow = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      shadowColor: "#000000",
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    }));
  }, []);

  const handleResetSettings = useCallback(() => {
    setSettings(defaultSettings);
    showToast('Settings have been reset!');
  }, [showToast]);

  const handleFontScaleChange = useCallback((scale: 'small' | 'medium' | 'large') => {
    const scales = {
      small: { minFontSize: 12, maxFontSize: 40 },
      medium: { minFontSize: 20, maxFontSize: 80 },
      large: { minFontSize: 30, maxFontSize: 120 },
    };
    setSettings(prev => ({ ...prev, ...scales[scale] }));
  }, []);

  const setOpenAccordionIds = useCallback((updater: (prev: number[]) => number[]) => {
    setSettings(prev => ({ ...prev, openAccordionIds: updater(prev.openAccordionIds) }));
  }, []);

  const handleAccordionToggle = useCallback((taskId: number) => {
    setOpenAccordionIds(prev => {
      const isOpen = prev.includes(taskId);
      if (isOpen) {
        return prev.filter(id => id !== taskId);
      }
      return [...prev, taskId];
    });
  }, [setOpenAccordionIds]);

  return {
    settings, setSettings,
    settingsRef, // Expose the ref
    setActiveCategoryId, setActiveSubCategoryId,
    applyDefaultShadow, resetShadow,
    handleResetSettings, handleFontScaleChange, handleAccordionToggle, setOpenAccordionIds,
  };
}