// Test utility to validate chat state management fixes
// Run this in browser console to test the fixes

window.compassTestUtils = {
  // Test localStorage corruption recovery
  testLocalStorageCorruption: () => {
    console.log('Testing localStorage corruption recovery...');
    
    // Save current data
    const currentData = localStorage.getItem('compass-app-data');
    
    try {
      // Corrupt the data
      localStorage.setItem('compass-app-data', '{"invalid": json}');
      
      // Reload the page to trigger recovery
      window.location.reload();
      
    } catch (e) {
      console.log('Corruption test completed - check console for recovery messages');
      // Restore original data if test fails
      if (currentData) {
        localStorage.setItem('compass-app-data', currentData);
      }
    }
  },

  // Test chat message persistence
  testChatPersistence: () => {
    console.log('Testing chat message persistence...');
    
    // Get current chat history
    const store = window.__compassStore;
    if (!store) {
      console.error('Store not available - make sure you are on the chat page');
      return;
    }
    
    const initialCount = store.getState().chatHistory.length;
    
    // Add test message
    store.getState().addChatMessage({
      role: 'user',
      message: 'Test message for persistence - ' + Date.now()
    });
    
    const afterAddCount = store.getState().chatHistory.length;
    
    // Verify message was added
    if (afterAddCount === initialCount + 1) {
      console.log('✅ Message added successfully');
      
      // Test persistence by checking localStorage
      const stored = JSON.parse(localStorage.getItem('compass-app-data') || '{}');
      if (stored.chatHistory && stored.chatHistory.length === afterAddCount) {
        console.log('✅ Message persisted to localStorage');
      } else {
        console.error('❌ Message NOT persisted to localStorage');
      }
    } else {
      console.error('❌ Message NOT added to state');
    }
  },

  // Test error recovery
  testErrorRecovery: () => {
    console.log('Testing error recovery...');
    
    try {
      // Simulate a state corruption
      const store = window.__compassStore;
      if (!store) {
        console.error('Store not available');
        return;
      }
      
      // This should not crash the app
      store.getState().addChatMessage(null);
      store.getState().addChatMessage(undefined);
      store.getState().addChatMessage({ role: null, message: null });
      
      console.log('✅ Error recovery working - app did not crash');
      
    } catch (e) {
      console.error('❌ Error recovery failed:', e);
    }
  },

  // Clear all test data
  clearTestData: () => {
    const store = window.__compassStore;
    if (store) {
      store.getState().clearChatHistory();
      console.log('✅ Test data cleared');
    }
  },

  // Get current state summary
  getStateSummary: () => {
    const store = window.__compassStore;
    if (!store) {
      console.error('Store not available');
      return;
    }
    
    const state = store.getState();
    return {
      chatMessages: state.chatHistory.length,
      contacts: state.contacts.length,
      events: state.events.length,
      books: state.books.length,
      localStorageSize: new Blob([localStorage.getItem('compass-app-data') || '']).size
    };
  }
};

// Expose store for testing if in development
if (import.meta.env.DEV) {
  const { useStore } = await import('../stores/useStore');
  window.__compassStore = useStore;
}

console.log('🧪 Compass Test Utils loaded. Available methods:');
console.log('- compassTestUtils.testLocalStorageCorruption()');
console.log('- compassTestUtils.testChatPersistence()'); 
console.log('- compassTestUtils.testErrorRecovery()');
console.log('- compassTestUtils.clearTestData()');
console.log('- compassTestUtils.getStateSummary()');