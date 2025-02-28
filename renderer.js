const { ipcRenderer } = require('electron');

// Store all tab information
const tabs = [];
let activeTabId = null;
let tabCounter = 0;

// DOM elements
const tabsBar = document.getElementById('tabs-bar');
const newTabButton = document.getElementById('new-tab');
const tabsContent = document.getElementById('tabs-content');

// Create new tab
async function createTab() {
  const tabId = `tab-${tabCounter++}`;
  
  // Create tab DOM element
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.tabId = tabId;
  tabElement.innerHTML = `
    <div class="tab-title">${tabId}</div>
    <div class="close-tab" data-tab-id="${tabId}">×</div>
  `;
  
  // Insert tab into DOM (before the "+" button)
  tabsBar.insertBefore(tabElement, newTabButton);
  
  // Create WebContentsView and get ID
  const webContentsId = await ipcRenderer.invoke('create-web-contents-view');
  
  // Store tab information
  tabs.push({
    id: tabId,
    element: tabElement,
    webContentsId: webContentsId,
    title: tabId
  });
  
  // Set new tab as active tab
  switchToTab(tabId);
  
  // Listen for tab click events
  tabElement.addEventListener('click', (e) => {
    if (!e.target.classList.contains('close-tab')) {
      switchToTab(tabId);
    }
  });
  
  // Listen for close button click events
  const closeButton = tabElement.querySelector('.close-tab');
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(tabId);
  });
  
  return tabId;
}

// Switch to specified tab
async function switchToTab(tabId) {
  // If already the active tab, do nothing
  if (activeTabId === tabId) return;
  
  // Find the tab to activate
  const targetTab = tabs.find(tab => tab.id === tabId);
  if (!targetTab) return;
  
  // Get current active tab
  const currentActiveTab = tabs.find(tab => tab.id === activeTabId);
  
  // Prepare visibility changes for a single IPC call
  const visibilityChanges = [];
  
  // First, make the new tab visible
  if (targetTab.webContentsId) {
    visibilityChanges.push({
      id: targetTab.webContentsId,
      visible: true
    });
  }
  
  // Then hide the current active tab
  if (currentActiveTab && currentActiveTab.webContentsId) {
    visibilityChanges.push({
      id: currentActiveTab.webContentsId,
      visible: false
    });
  }
  
  // Apply all visibility changes in a single IPC call
  if (visibilityChanges.length > 0) {
    await ipcRenderer.invoke('set-multiple-views-visibility', visibilityChanges);
  }
  
  // Update UI
  if (currentActiveTab) {
    currentActiveTab.element.classList.remove('active');
  }
  targetTab.element.classList.add('active');
  
  // Update active tab ID
  activeTabId = tabId;
}

// Close tab
async function closeTab(tabId) {
  // Find the index of the tab to close
  const tabIndex = tabs.findIndex(tab => tab.id === tabId);
  
  if (tabIndex !== -1) {
    const tab = tabs[tabIndex];
    
    // Remove tab element from DOM
    tab.element.remove();
    
    // Destroy WebContentsView
    if (tab.webContentsId) {
      await ipcRenderer.invoke('destroy-web-contents-view', tab.webContentsId);
    }
    
    // Remove from tabs array
    tabs.splice(tabIndex, 1);
    
    // If closing the current active tab, switch to another tab
    if (activeTabId === tabId) {
      if (tabs.length > 0) {
        // Prefer switching to the right tab, if none then switch to left tab
        const newActiveTab = tabs[Math.min(tabIndex, tabs.length - 1)];
        switchToTab(newActiveTab.id);
      } else {
        // If no tabs left, create a new tab
        createTab();
      }
    }
  }
}

// Initialize: create the first tab
createTab();

// Listen for new tab button click events
newTabButton.addEventListener('click', createTab); 