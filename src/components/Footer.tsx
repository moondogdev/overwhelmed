import React from 'react';

export const Footer = React.memo(() => {
  const currentYear = new Date().getFullYear();
  const version = '1.0.0'; // You can update this manually or pull from package.json
  const companyUrl = 'https://moondogdevelopment.com';
  const githubUrl = 'https://github.com/moondogdev/overwhelmed';

  return (
  
    <div className='footer-credit'>        
      <div className='version'>
        <a href="#" onClick={() => window.electronAPI.openExternalLink({ url: githubUrl, browserPath: undefined })}><span className='app-name'>Overwhelmed</span> • Version: {version}</a>
      </div>
      <div>
        Copyright © {currentYear} • <a href="#" onClick={() => window.electronAPI.openExternalLink({ url: companyUrl, browserPath: undefined })}>Moondog Development, LLC</a>
      </div>        
    </div>
  );
});