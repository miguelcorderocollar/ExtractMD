// Simple inline test - paste this in console
(async function testSidebar() {
  console.clear();
  console.log('🧪 ExtractMD Sidebar Diagnostic Test\n');

  // Step 1: Check current storage
  console.log('📦 Step 1: Checking Storage...');
  const syncData = await chrome.storage.sync.get(null);
  const localData = await chrome.storage.local.get(null);

  console.log('All sync storage:', syncData);
  console.log('All local storage:', localData);

  console.log('\n🎯 AI Chat Specific Settings:');
  console.log('  aiChatEnabled:', syncData.aiChatEnabled);
  console.log('  aiChatOutputMode:', syncData.aiChatOutputMode);
  console.log('  aiChatAutoOpen:', syncData.aiChatAutoOpen);
  console.log('  aiChatSendDirectly:', syncData.aiChatSendDirectly);
  console.log('  aiChatModel:', syncData.aiChatModel);

  // Step 2: Simulate the shouldOpenSidebar logic
  console.log('\n🔍 Step 2: Testing Sidebar Logic...');
  const shouldOpen =
    syncData.aiChatEnabled &&
    (syncData.aiChatOutputMode === 'sidebar' || syncData.aiChatOutputMode === 'both');

  console.log('Calculation:');
  console.log('  aiChatEnabled =', syncData.aiChatEnabled);
  console.log('  outputMode =', syncData.aiChatOutputMode);
  console.log(
    '  outputMode is "sidebar" or "both" =',
    syncData.aiChatOutputMode === 'sidebar' || syncData.aiChatOutputMode === 'both'
  );
  console.log('  ➡️ shouldOpenSidebar =', shouldOpen);

  // Step 3: If false, set correct values
  if (!shouldOpen) {
    console.log('\n❌ Sidebar will NOT open with current settings!');
    console.log('\n🔧 Fixing settings...');
    await chrome.storage.sync.set({
      aiChatEnabled: true,
      aiChatOutputMode: 'sidebar',
    });
    console.log('✅ Settings updated! Verifying...');

    const verify = await chrome.storage.sync.get(['aiChatEnabled', 'aiChatOutputMode']);
    console.log('New settings:', verify);
    console.log('\n✅ Try clicking the floating button now!');
  } else {
    console.log('\n✅ Settings are correct! Sidebar SHOULD open.');
    console.log("\nIf it still doesn't open, check background.js logs.");
  }

  // Step 4: Test if we can open sidebar directly
  console.log('\n🚀 Step 4: Testing Direct Sidebar Open...');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Current tab ID:', tab.id);
    console.log('Attempting to open sidebar...');
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log('✅ SUCCESS! Sidebar opened directly!');
    console.log("   If this works but floating button doesn't, the issue is in content script.");
  } catch (error) {
    console.error('❌ ERROR opening sidebar:', error);
    console.log('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }

  console.log('\n📊 Test Complete!');
})();
