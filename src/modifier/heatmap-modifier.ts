export class HeatmapModifier {
  private active: boolean = false;
  private metric: string = '';
  private mode: string = '';
  private applicationId: string = '';

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
  }

  getMetric(): string {
    return this.metric;
  }

  setMetric(metric: string): void {
    this.metric = metric;
  }

  getMode(): string {
    return this.mode;
  }

  setMode(mode: string): void {
    this.mode = mode;
  }

  getApplicationId(): string {
    return this.applicationId;
  }

  setApplicationId(applicationId: string): void {
    this.applicationId = applicationId;
  }

  clear(): void {
    this.active = false;
    this.metric = '';
    this.mode = '';
    this.applicationId = '';
  }
}
