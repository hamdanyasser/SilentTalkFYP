import { Page, Locator } from '@playwright/test';

export class LibraryPage {
  readonly page: Page;
  readonly tutorialsList: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly videoPlayer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tutorialsList = page.locator('[data-testid="tutorials-list"], .tutorials-list');
    this.searchInput = page.getByPlaceholder(/search/i);
    this.categoryFilter = page.locator('select[name="category"]');
    this.videoPlayer = page.locator('video').first();
  }

  async goto() {
    await this.page.goto('/learn');
  }

  async searchTutorials(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.page.waitForLoadState('networkidle');
  }

  async openTutorial(title: string) {
    await this.page.getByRole('link', { name: new RegExp(title, 'i') }).first().click();
    await this.page.waitForURL(/.*tutorial\/.*/);
  }

  async playVideo() {
    await this.videoPlayer.click();
  }

  async getTutorialCount(): Promise<number> {
    return await this.tutorialsList.locator('[data-testid="tutorial-item"]').count();
  }

  async rateTutorial(rating: number) {
    const ratingButton = this.page.locator(`button[data-rating="${rating}"]`);
    await ratingButton.click();
  }

  async searchGlossary(term: string) {
    await this.page.goto('/glossary');
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }
}
