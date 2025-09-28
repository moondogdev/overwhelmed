import React from 'react';
import { SimpleAccordion } from './SidebarComponents';
import { useAppContext } from '../contexts/AppContext';

export function MemeViewSettings() {
  const {
    settings, setSettings, handleResetSettings, handleFontScaleChange, applyDefaultShadow, resetShadow
  } = useAppContext();
  return (
    <SimpleAccordion title="Meme View Settings">
      <h2 style={{marginTop: 0}}>Settings</h2>
      <button onClick={handleResetSettings}>Reset All Settings</button>
      <SimpleAccordion title="Overlay Settings">
        <label className="checkbox-label flexed-column">
          <input type="checkbox" checked={settings.isOverlayEnabled} onChange={(e) => setSettings(prev => ({ ...prev, isOverlayEnabled: e.target.checked }))} />
          <span className='checkbox-label-text'>Enable Overlay</span>
        </label>
        {settings.isOverlayEnabled && (
          <>
            <label>
              Overlay Color:
              <input type="color" value={settings.overlayColor} onChange={(e) => setSettings(prev => ({ ...prev, overlayColor: e.target.value }))} />
            </label>
            <label>
              Overlay Opacity: {Math.round(settings.overlayOpacity * 100)}%
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.overlayOpacity}
                onChange={(e) => setSettings(prev => ({ ...prev, overlayOpacity: Number(e.target.value) }))}
              />
            </label>
          </>
        )}
      </SimpleAccordion>
      <SimpleAccordion title="General Settings">
        <label>
          Font Family:
          <input
            type="text"
            value={settings.fontFamily}
            onChange={(e) => setSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
          />
        </label>
        <label>
          Font Color:
          <input type="color" value={settings.fontColor} onChange={(e) => setSettings(prev => ({ ...prev, fontColor: e.target.value }))} />
        </label>
        <label>
          Font Scale:
          <div className="button-group">
            <button onClick={() => handleFontScaleChange('small')}>Small</button>
            <button onClick={() => handleFontScaleChange('medium')}>Medium</button>
            <button onClick={() => handleFontScaleChange('large')}>Large</button>
          </div>
        </label>
        <label className="checkbox-label flexed-column">
          <input type="checkbox" checked={settings.isDebugModeEnabled} onChange={(e) => setSettings(prev => ({ ...prev, isDebugModeEnabled: e.target.checked }))} />
          <span className='checkbox-label-text'>Debug Mode</span>
        </label>
      </SimpleAccordion>

      <SimpleAccordion title="Shadow Settings">
        <button onClick={applyDefaultShadow}>Apply Default Shadow</button>
        <button onClick={resetShadow}>Reset Shadow</button>
        <label>
          Shadow Color:
          <input type="color" value={settings.shadowColor} onChange={(e) => setSettings(prev => ({ ...prev, shadowColor: e.target.value }))} />
        </label>
        <label>
          Shadow Blur: {settings.shadowBlur}px
          <input type="range" min="0" max="50" value={settings.shadowBlur} onChange={(e) => setSettings(prev => ({ ...prev, shadowBlur: Number(e.target.value) }))} />
        </label>
        <label>
          Offset X: {settings.shadowOffsetX}px
          <input type="range" min="-50" max="50" value={settings.shadowOffsetX} onChange={(e) => setSettings(prev => ({ ...prev, shadowOffsetX: Number(e.target.value) }))} />
        </label>
        <label>
          Offset Y: {settings.shadowOffsetY}px
          <input type="range" min="-50" max="50" value={settings.shadowOffsetY} onChange={(e) => setSettings(prev => ({ ...prev, shadowOffsetY: Number(e.target.value) }))} />
        </label>
      </SimpleAccordion>
    </SimpleAccordion>
  );
}