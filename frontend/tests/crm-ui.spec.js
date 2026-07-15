import { test, expect } from '@playwright/test';

test.describe('CRM UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the main page
    await page.goto('/');
  });

  test('renders the main layout and titles', async ({ page }) => {
    // Check main title
    await expect(page.locator('h1.main-title')).toHaveText('Log HCP Interaction');
    
    // Check panel titles
    await expect(page.locator('h3.section-title').first()).toHaveText('Interaction Details');
    await expect(page.locator('.chat-header h2')).toContainText('AI Assistant');
  });

  test('form fields have correct readonly and disabled states', async ({ page }) => {
    // Verify inputs are readonly (managed by AI)
    await expect(page.getByPlaceholder('Search or select HCP...')).toHaveAttribute('readonly', '');
    await expect(page.getByPlaceholder('Enter names or search...')).toHaveAttribute('readonly', '');
    await expect(page.getByPlaceholder('Enter key discussion points...')).toHaveAttribute('readonly', '');
    
    // Verify select is disabled
    const selectBox = page.locator('select');
    await expect(selectBox).toBeDisabled();
    
    // Verify radio buttons are disabled
    const radioButtons = page.locator('input[type="radio"]');
    const count = await radioButtons.count();
    expect(count).toBe(3);
    for (let i = 0; i < count; i++) {
      await expect(radioButtons.nth(i)).toBeDisabled();
    }
  });

  test('action buttons are correctly disabled', async ({ page }) => {
    // Check voice note button
    const voiceBtn = page.locator('button', { hasText: 'Summarize from Voice Note' });
    await expect(voiceBtn).toBeDisabled();
    
    // Check search/add buttons
    const searchAddBtn = page.locator('button', { hasText: 'Search/Add' });
    await expect(searchAddBtn).toBeDisabled();
    
    const addSampleBtn = page.locator('button', { hasText: 'Add Sample' });
    await expect(addSampleBtn).toBeDisabled();
  });

  test('chat input can be typed into and enables submit button', async ({ page }) => {
    // Find chat input
    const chatInput = page.locator('input.chat-input');
    const submitBtn = page.locator('button.chat-submit');
    
    // Wait for connection to LangGraph (input becomes enabled)
    await expect(chatInput).toBeEnabled({ timeout: 10000 });
    
    // Initially submit is disabled because input is empty
    await expect(submitBtn).toBeDisabled();
    
    // Type a message
    await chatInput.fill('Dr. Smith meeting notes');
    
    // Now submit should be enabled
    await expect(submitBtn).toBeEnabled();
  });
});
