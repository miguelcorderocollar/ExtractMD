// Test utility to verify AI Chat sidebar settings
// Run this in the browser console on any page with ExtractMD loaded

async function testSidebarSettings() {
  console.log('=== ExtractMD Sidebar Settings Test ===\n');

  // Test 1: Check if settings are saved
  console.log('1. Checking current settings...');
  const settings = await chrome.storage.sync.get([
    'aiChatEnabled',
    'aiChatAutoOpen',
    'aiChatOutputMode',
    'aiChatModel',
    'aiChatSystemPrompt',
    'aiChatSendDirectly',
  ]);
  console.log('Current AI Chat settings:', settings);

  // Test 2: Check API key
  console.log('\n2. Checking API key...');
  const apiKey = await chrome.storage.local.get(['aiChatOpenRouterApiKey']);
  console.log('API key exists:', !!apiKey.aiChatOpenRouterApiKey);
  console.log(
    'API key length:',
    apiKey.aiChatOpenRouterApiKey ? apiKey.aiChatOpenRouterApiKey.length : 0
  );

  // Test 3: Verify sidebar should open logic
  console.log('\n3. Testing sidebar open conditions...');
  const shouldOpen =
    settings.aiChatEnabled &&
    (settings.aiChatOutputMode === 'sidebar' || settings.aiChatOutputMode === 'both');
  console.log('Should sidebar open?', shouldOpen);
  console.log('  - aiChatEnabled:', settings.aiChatEnabled);
  console.log('  - aiChatOutputMode:', settings.aiChatOutputMode);
  console.log(
    '  - Mode includes sidebar:',
    settings.aiChatOutputMode === 'sidebar' || settings.aiChatOutputMode === 'both'
  );

  // Test 4: Set correct settings for testing
  console.log('\n4. Setting correct test configuration...');
  await chrome.storage.sync.set({
    aiChatEnabled: true,
    aiChatOutputMode: 'sidebar',
    aiChatAutoOpen: true,
    aiChatSendDirectly: true,
  });
  console.log('✅ Test settings applied:');
  console.log('  - aiChatEnabled: true');
  console.log('  - aiChatOutputMode: sidebar');
  console.log('  - aiChatAutoOpen: true');
  console.log('  - aiChatSendDirectly: true');

  // Verify
  const newSettings = await chrome.storage.sync.get([
    'aiChatEnabled',
    'aiChatOutputMode',
    'aiChatAutoOpen',
    'aiChatSendDirectly',
  ]);
  console.log('\n5. Verifying settings were saved...');
  console.log('Saved settings:', newSettings);

  console.log('\n=== Test Complete ===');
  console.log(
    '\nNow try clicking the ExtractMD floating button and check the console for debug messages.'
  );
  console.log('Expected log sequence:');
  console.log('  1. [ExtractMD] AI Chat Settings: {...}');
  console.log('  2. [ExtractMD] Sidebar decision: {...}');
  console.log('  3. [ExtractMD] Attempting to open sidebar...');
  console.log('  4. [ExtractMD Background] Received openSidebarWithContent request');
  console.log('  5. [ExtractMD Background] ✅ Sidebar opened');
}

// Auto-run the test
testSidebarSettings().catch(console.error);
