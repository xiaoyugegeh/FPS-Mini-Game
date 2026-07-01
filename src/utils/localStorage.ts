import { SaveData } from '../types';

const SAVE_KEY = 'valorant_tutorial_save_v1';

/**
 * 默认存档数据
 */
function getDefaultSaveData(): SaveData {
  return {
    currentStage: 0,
    stagesCompleted: new Array(7).fill(false),
    bestScore: 0,
    bestTime: 0,
    lastPlayedAt: new Date().toISOString(),
  };
}

/**
 * 从 localStorage 读取存档
 */
export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return getDefaultSaveData();
    const parsed = JSON.parse(raw) as SaveData;
    return { ...getDefaultSaveData(), ...parsed };
  } catch (error) {
    console.warn('[Save] 读取存档失败，使用默认数据:', error);
    return getDefaultSaveData();
  }
}

/**
 * 保存存档到 localStorage
 */
export function saveSaveData(data: Partial<SaveData>): SaveData {
  try {
    const current = loadSaveData();
    const next: SaveData = {
      ...current,
      ...data,
      lastPlayedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.warn('[Save] 保存存档失败:', error);
    return getDefaultSaveData();
  }
}

/**
 * 清除存档
 */
export function clearSaveData(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.warn('[Save] 清除存档失败:', error);
  }
}
