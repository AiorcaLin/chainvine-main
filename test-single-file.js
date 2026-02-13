/**
 * Automated Test Script for Mush Audit - Single File Tab
 * 
 * Prerequisites:
 * 1. Install Puppeteer: npm install puppeteer
 * 2. Ensure the dev server is running on http://localhost:3000
 * 
 * Run: node test-single-file.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function testSingleFileTab() {
  console.log('🚀 Starting Mush Audit Single File Tab Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Step 1: Navigate to the audit page
    console.log('📍 Step 1: Navigating to http://localhost:3000/audit');
    await page.goto('http://localhost:3000/audit', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-initial-page.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot saved: 01-initial-page.png\n');

    // Step 2: Take initial snapshot
    console.log('📸 Step 2: Taking initial snapshot');
    const initialContent = await page.evaluate(() => {
      return {
        title: document.querySelector('h1')?.textContent || 'No title found',
        tabs: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(Boolean),
        activeTab: document.querySelector('button[class*="bg-[#252526]"]')?.textContent?.trim() || 'None'
      };
    });
    console.log('Page Title:', initialContent.title);
    console.log('Available Tabs:', initialContent.tabs);
    console.log('Active Tab:', initialContent.activeTab);
    console.log('');

    // Step 3: Click the "Single File" tab
    console.log('🖱️  Step 3: Clicking "Single File" tab');
    
    // Wait for the tab to be visible
    await page.waitForSelector('button', { timeout: 5000 });
    
    // Find and click the Single File tab
    const singleFileTabClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const singleFileButton = buttons.find(btn => 
        btn.textContent?.includes('Single File')
      );
      
      if (singleFileButton) {
        singleFileButton.click();
        return true;
      }
      return false;
    });

    if (!singleFileTabClicked) {
      throw new Error('❌ Could not find "Single File" tab button');
    }

    // Wait for the editor to load
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-single-file-tab-clicked.png'),
      fullPage: true 
    });
    console.log('✅ Single File tab clicked');
    console.log('✅ Screenshot saved: 02-single-file-tab-clicked.png\n');

    // Step 4: Verify Monaco editor appeared
    console.log('🔍 Step 4: Verifying Monaco editor');
    
    const editorInfo = await page.evaluate(() => {
      // Check for Monaco editor
      const monacoEditor = document.querySelector('.monaco-editor');
      const editorTextArea = document.querySelector('textarea.inputarea');
      const analyzeButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Analyze Contract')
      );
      
      // Try to get editor content
      let editorContent = '';
      if (editorTextArea) {
        editorContent = editorTextArea.value || 'Could not read content';
      }
      
      return {
        monacoEditorFound: !!monacoEditor,
        editorTextAreaFound: !!editorTextArea,
        analyzeButtonFound: !!analyzeButton,
        editorContentPreview: editorContent.substring(0, 200) + '...',
        editorHeight: monacoEditor?.offsetHeight || 0
      };
    });

    console.log('Monaco Editor Found:', editorInfo.monacoEditorFound);
    console.log('Editor TextArea Found:', editorInfo.editorTextAreaFound);
    console.log('Editor Height:', editorInfo.editorHeight + 'px');
    console.log('Analyze Button Found:', editorInfo.analyzeButtonFound);
    console.log('Editor Content Preview:', editorInfo.editorContentPreview);
    console.log('');

    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-monaco-editor-visible.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot saved: 03-monaco-editor-visible.png\n');

    // Step 5: Click "Analyze Contract" button
    console.log('🖱️  Step 5: Clicking "Analyze Contract" button');
    
    const analyzeButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const analyzeButton = buttons.find(btn => 
        btn.textContent?.includes('Analyze Contract')
      );
      
      if (analyzeButton) {
        analyzeButton.click();
        return true;
      }
      return false;
    });

    if (!analyzeButtonClicked) {
      throw new Error('❌ Could not find "Analyze Contract" button');
    }

    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    console.log('✅ Analyze Contract button clicked\n');

    // Step 6: Verify AI Config modal appeared
    console.log('🔍 Step 6: Verifying AI Config modal');
    
    const modalInfo = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]') || 
                    document.querySelector('.fixed.inset-0') ||
                    document.querySelector('div[class*="z-50"]');
      
      const modalTitle = document.querySelector('h3')?.textContent || 'No title found';
      
      // Get all select/dropdown elements
      const selects = Array.from(document.querySelectorAll('select'));
      const modelOptions = selects[0] ? Array.from(selects[0].options).map(opt => opt.textContent) : [];
      
      // Get checkboxes
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      const superPromptCheckbox = checkboxes.find(cb => 
        cb.id === 'superPrompt' || cb.nextElementSibling?.textContent?.includes('Super Prompt')
      );
      
      // Get API key input
      const apiKeyInput = document.querySelector('input[type="password"]');
      
      // Get buttons
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim());
      
      return {
        modalFound: !!modal,
        modalTitle: modalTitle,
        modelOptions: modelOptions,
        superPromptChecked: superPromptCheckbox?.checked || false,
        apiKeyInputFound: !!apiKeyInput,
        apiKeyPlaceholder: apiKeyInput?.placeholder || '',
        buttons: buttons.filter(Boolean)
      };
    });

    console.log('Modal Found:', modalInfo.modalFound);
    console.log('Modal Title:', modalInfo.modalTitle);
    console.log('Model Options:', modalInfo.modelOptions);
    console.log('Super Prompt Checked:', modalInfo.superPromptChecked);
    console.log('API Key Input Found:', modalInfo.apiKeyInputFound);
    console.log('API Key Placeholder:', modalInfo.apiKeyPlaceholder);
    console.log('Available Buttons:', modalInfo.buttons);
    console.log('');

    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-ai-config-modal.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot saved: 04-ai-config-modal.png\n');

    // Additional: Check language dropdown
    console.log('🔍 Step 7: Checking Response Language options');
    
    // Click on the language dropdown to see options
    const languageDropdownClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const languageButton = buttons.find(btn => 
        btn.textContent?.includes('English') || 
        btn.className?.includes('Listbox')
      );
      
      if (languageButton) {
        languageButton.click();
        return true;
      }
      return false;
    });

    if (languageDropdownClicked) {
      await page.waitForTimeout(500);
      
      const languageOptions = await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('[role="option"]'));
        return options.map(opt => opt.textContent?.trim()).filter(Boolean);
      });
      
      console.log('Language Options Found:', languageOptions.length);
      console.log('Sample Languages:', languageOptions.slice(0, 10));
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, '05-language-dropdown-open.png'),
        fullPage: true 
      });
      console.log('✅ Screenshot saved: 05-language-dropdown-open.png\n');
    }

    console.log('✅ All tests completed successfully!');
    console.log(`📁 Screenshots saved in: ${screenshotsDir}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

// Run the test
testSingleFileTab().catch(console.error);
