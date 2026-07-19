import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Appointments Calendar page.
 *
 * Assumptions:
 * - Frontend runs at http://localhost:5173
 * - Backend API runs with seeded data (docker compose up + npm run db:seed)
 * - Seeded data includes clients and pets (Alice Johnson → Max the Dog, etc.)
 *
 * Run: npx playwright test --grep "appointments"
 */

test.describe('appointments calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="appointments-page"]');
  });

  test('displays the calendar grid with 7 day columns', async ({ page }) => {
    // Calendar week title should contain month and year
    const weekTitle = page.locator('h2');
    await expect(weekTitle).toContainText(/2026/);

    // Day names should be visible (Mon–Sun via i18n)
    await expect(page.getByText('days.mon')).toBeVisible();
    await expect(page.getByText('days.sun')).toBeVisible();
  });

  test('opens the new appointment modal from the page header', async ({ page }) => {
    // Click the "New Appointment" button in the page header
    await page.getByText('newAppointment').first().click();

    // Modal should be visible
    await expect(page.getByText('form.title')).toBeVisible();
    await expect(page.getByText('form.save')).toBeVisible();
  });

  test('navigates to next week and updates the URL', async ({ page }) => {
    // Click "Next week" navigation
    await page.getByText('nav.next').click();

    // URL should update with week param
    await expect(page).toHaveURL(/\/calendar\?week=/);
  });

  test('closes modal on cancel button', async ({ page }) => {
    // Open modal
    await page.getByText('newAppointment').first().click();
    await expect(page.getByText('form.title')).toBeVisible();

    // Click cancel
    await page.getByText('form.cancel').click();

    // Modal should close
    await expect(page.getByText('form.title')).not.toBeVisible();
  });
});
