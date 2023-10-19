export class HighlightingModel {
  private readonly highlightedApp: string;
  private readonly highlightedEntity: string;
  private readonly entityType: string;

  constructor(appId: string, entityId: string, entityType: string) {
    this.highlightedApp = appId;
    this.highlightedEntity = entityId;
    this.entityType = entityType;
  }

  getHighlightedApp(): string {
    return this.highlightedApp;
  }

  getHighlightedEntity(): string {
    return this.highlightedEntity;
  }

  getEntityType(): string {
    return this.entityType;
  }
}
