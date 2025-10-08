import React from 'react';
import { SimpleAccordion } from '../SidebarComponents';
import { useAppContext } from '../../contexts/AppContext';

export function ExternalLinkManager() {
  const { settings, setSettings } = useAppContext();
  return (
    <SimpleAccordion title="External Link Manager">
      <div className="link-manager-section">
        <h4>Header Links</h4>
        {(settings.externalLinks || []).map((link, index) => (
          <div key={index} className="external-link-manager-item">
            <div className="link-manager-item">
              <label className='flexed'>
                <span>Link Name</span>
                <input
                  type="text"
                  placeholder="Link Name"
                  value={link.name}
                  onChange={(e) => {
                    const newLinks = [...(settings.externalLinks || [])];
                    newLinks[index].name = e.target.value;
                    setSettings(prev => ({ ...prev, externalLinks: newLinks }));
                  }}
                />
              </label>
            </div>
            <div className="link-manager-item">
              <label className='flexed'>
                <span>Link URL</span>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={link.url}
                  onChange={(e) => {
                    const newLinks = [...(settings.externalLinks || [])];
                    newLinks[index].url = e.target.value;
                    setSettings(prev => ({ ...prev, externalLinks: newLinks }));
                  }}
                />
              </label>
            </div>
            <button className="remove-link-btn" onClick={() => setSettings(prev => ({ ...prev, externalLinks: (prev.externalLinks || []).filter((_, i) => i !== index) }))}>Remove Link</button>
            <label title="Open this link in the system's default browser, ignoring the active browser setting.">
              <input type="checkbox" checked={link.openInDefault || false} onChange={(e) => {
                const newLinks = [...(settings.externalLinks || [])];
                newLinks[index].openInDefault = e.target.checked;
                setSettings(prev => ({ ...prev, externalLinks: newLinks }));
              }} /> <span className='checkbox-label-text' style={{ fontSize: '12px' }}>Open Default</span>
            </label>

          </div>
        ))}
        <button className="add-link-btn-full" onClick={() => setSettings(prev => ({ ...prev, externalLinks: [...(prev.externalLinks || []), { name: '', url: '', openInDefault: false }] }))}>
          <i className="fas fa-plus"></i> Add Link
        </button>
      </div>
      <div className="link-manager-section">
        <h4>Context Menu</h4>
        <label title="Use default browser for the 'Search Google' context menu action.">
          <input type="checkbox" checked={settings.useDefaultBrowserForSearch || false} onChange={(e) => {
            setSettings(prev => ({ ...prev, useDefaultBrowserForSearch: e.target.checked }));
          }} /> Open "Search Google" in default browser
        </label>
      </div>
    </SimpleAccordion>
  );
}