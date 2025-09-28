import { useState, useCallback } from 'react';
import { Settings } from '../types';
import { defaultSettings } from '../config';

interface UseSettingsProps {
  showToast: (message: string, duration?: number) => void;
}

export function useSettings({ showToast }: UseSettingsProps) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

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

  const handleAccordionToggle = useCallback((wordId: number) => {
    setOpenAccordionIds(prev => {
      const isOpen = prev.includes(wordId);
      if (isOpen) {
        return prev.filter(id => id !== wordId);
      }
      return [...prev, wordId];
    });
  }, [setOpenAccordionIds]);

  return {
    settings, setSettings,
    setActiveCategoryId, setActiveSubCategoryId,
    applyDefaultShadow, resetShadow,
    handleResetSettings, handleFontScaleChange, handleAccordionToggle, setOpenAccordionIds,
  };
}