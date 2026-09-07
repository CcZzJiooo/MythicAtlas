import {
  DESTINATIONS_DATA,
  findDestinationByDateKey,
  findDestinationById,
  getFallbackDestinationIndex
} from '../data/destinations';
import type { CalendarStatus, DestinationItem } from '../types';
import { StorageManager } from './StorageManager';

export class TimeEngine {
  private static instance: TimeEngine;
  private storage: StorageManager;

  private constructor() {
    this.storage = StorageManager.getInstance();
  }

  public static getInstance(): TimeEngine {
    if (!TimeEngine.instance) {
      TimeEngine.instance = new TimeEngine();
    }
    return TimeEngine.instance;
  }

  /**
   * 获取当前有效基准日期 (支持神谕推演偏移)
   */
  public getEffectiveDate(): Date {
    const now = new Date();
    const progress = this.storage.getProgress();
    if (progress.isOracleMode && progress.oracleDateOffset !== 0) {
      const offsetMs = progress.oracleDateOffset * 24 * 60 * 60 * 1000;
      return new Date(now.getTime() + offsetMs);
    }
    return now;
  }

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  public formatDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * 计算当前日历解锁状态与数据划分
   */
  public getCalendarStatus(): CalendarStatus {
    const effectiveDate = this.getEffectiveDate();
    const todayKey = this.formatDateKey(effectiveDate);

    // 查找匹配的今日地标 (如超出则基于日期哈希模除映射，确保每日必有一境)
    const matchedDestination = findDestinationByDateKey(todayKey);
    const todayIndex = matchedDestination
      ? matchedDestination.dayIndex
      : getFallbackDestinationIndex(effectiveDate);
    const todayDestination = matchedDestination || DESTINATIONS_DATA[todayIndex];

    const pastDestinations: DestinationItem[] = [];
    const futureDestinations: DestinationItem[] = [];

    DESTINATIONS_DATA.forEach(item => {
      if (item.dayIndex <= todayIndex) {
        pastDestinations.push(item);
      } else {
        futureDestinations.push(item);
      }
    });

    // 计算距离明日 00:00:00 的精确毫秒
    const nextMidnight = new Date(effectiveDate);
    nextMidnight.setHours(24, 0, 0, 0);
    const nextUnlockTime = nextMidnight.getTime();

    const diffMs = Math.max(0, nextUnlockTime - effectiveDate.getTime());
    const countdownStr = this.formatCountdown(diffMs);

    return {
      todayIndex,
      todayKey,
      todayDestination,
      pastDestinations,
      futureDestinations,
      nextUnlockTime,
      countdownStr
    };
  }

  /**
   * 校验特定地标是否已解锁 (严格防未来穿越)
   */
  public isDestinationUnlocked(destinationId: string): boolean {
    const status = this.getCalendarStatus();
    const target = findDestinationById(destinationId);
    if (!target) return false;
    return target.dayIndex <= status.todayIndex;
  }

  /**
   * 格式化毫秒为 HH:MM:SS
   */
  public formatCountdown(ms: number): string {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * 调整神谕推演偏移量 (天数)
   */
  public setOracleOffset(offset: number) {
    this.storage.setOracleOffset(offset);
  }
}
