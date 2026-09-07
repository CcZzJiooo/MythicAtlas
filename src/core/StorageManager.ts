import { UserProgress } from '../types';

const STORAGE_KEY = 'mythic_atlas_user_data_v1';

export class StorageManager {
  private static instance: StorageManager;
  private progress: UserProgress;

  private constructor() {
    this.progress = this.loadFromStorage();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private loadFromStorage(): UserProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read from localStorage', e);
    }
    return {
      collectedSeals: ['guangzhou', 'shenzhen', 'zhuhai'], // 预置默认盖印广深珠三处，丰富初次体验
      visitedDestinations: ['guangzhou', 'shenzhen', 'zhuhai', 'foshan', 'shaoguan'],
      customNotes: {},
      oracleDateOffset: 0,
      isOracleMode: false
    };
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  public getProgress(): UserProgress {
    return { ...this.progress };
  }

  public collectSeal(destinationId: string): boolean {
    if (!this.progress.collectedSeals.includes(destinationId)) {
      this.progress.collectedSeals.push(destinationId);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public isSealCollected(destinationId: string): boolean {
    return this.progress.collectedSeals.includes(destinationId);
  }

  public markVisited(destinationId: string) {
    if (!this.progress.visitedDestinations.includes(destinationId)) {
      this.progress.visitedDestinations.push(destinationId);
      this.saveToStorage();
    }
  }

  public saveNote(destinationId: string, note: string) {
    this.progress.customNotes[destinationId] = note;
    this.saveToStorage();
  }

  public saveCustomNote(destinationId: string, note: string) {
    this.saveNote(destinationId, note);
  }

  public setOracleOffset(offset: number) {
    this.progress.oracleDateOffset = offset;
    this.progress.isOracleMode = offset !== 0;
    this.saveToStorage();
  }

  public resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
    this.progress = this.loadFromStorage();
  }
}
