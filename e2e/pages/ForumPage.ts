import { Page, Locator } from '@playwright/test';

export class ForumPage {
  readonly page: Page;
  readonly newThreadButton: Locator;
  readonly threadTitle: Locator;
  readonly threadContent: Locator;
  readonly submitThreadButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly threadList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newThreadButton = page.getByRole('button', { name: /new thread|create thread/i });
    this.threadTitle = page.getByLabel(/title/i);
    this.threadContent = page.getByLabel(/content|message|body/i);
    this.submitThreadButton = page.getByRole('button', { name: /post|submit|create/i });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.categoryFilter = page.locator('[data-testid="category-filter"], select[name="category"]');
    this.threadList = page.locator('[data-testid="thread-list"], .thread-list');
  }

  async goto() {
    await this.page.goto('/forum');
  }

  async createThread(title: string, content: string, category?: string) {
    await this.newThreadButton.click();
    await this.threadTitle.fill(title);
    await this.threadContent.fill(content);

    if (category) {
      await this.categoryFilter.selectOption(category);
    }

    await this.submitThreadButton.click();

    // Wait for thread to be created
    await this.page.waitForURL(/.*forum\/thread\/.*/);
  }

  async searchThreads(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async openThread(title: string) {
    await this.page.getByRole('link', { name: new RegExp(title, 'i') }).first().click();
    await this.page.waitForURL(/.*forum\/thread\/.*/);
  }

  async replyToThread(content: string) {
    const replyInput = this.page.getByLabel(/reply|comment/i);
    await replyInput.fill(content);
    const replyButton = this.page.getByRole('button', { name: /reply|post/i });
    await replyButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getThreadCount(): Promise<number> {
    return await this.threadList.locator('[data-testid="thread-item"], .thread-item').count();
  }

  async upvoteThread() {
    const upvoteButton = this.page.getByRole('button', { name: /upvote/i });
    await upvoteButton.click();
  }

  async reportThread() {
    const reportButton = this.page.getByRole('button', { name: /report/i });
    await reportButton.click();

    const reportReasonSelect = this.page.locator('select[name="reason"]');
    await reportReasonSelect.selectOption('spam');

    const submitReportButton = this.page.getByRole('button', { name: /submit report/i });
    await submitReportButton.click();
  }
}
