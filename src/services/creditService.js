import storageService from './storageService';
import { creditRules, getCreditLevel } from '../mock/credit';

const KEY = 'creditData';

function defaultCredit() {
  return {
    score: 92,
    logs: [
      { type: 'positive', reason: '完成一次学习搭子约定', score: 3, time: '2026-05-20' },
      { type: 'positive', reason: '获得搭子好评', score: 2, time: '2026-05-19' },
      { type: 'positive', reason: '发布真实有效的组队信息', score: 2, time: '2026-05-18' },
      { type: 'negative', reason: '取消预约过晚', score: -3, time: '2026-05-17' },
    ],
    dimensions: creditRules.dimensions,
    rankPercent: 86,
  };
}

export const creditService = {
  getData() {
    return storageService.get(KEY, defaultCredit());
  },
  saveData(data) {
    storageService.set(KEY, data);
  },
  addRecord(reason, delta) {
    const data = this.getData();
    data.score = Math.max(0, Math.min(100, data.score + delta));
    data.logs.unshift({ type: delta > 0 ? 'positive' : 'negative', reason, score: delta, time: new Date().toISOString().slice(0, 10) });
    data.logs = data.logs.slice(0, 50);
    this.saveData(data);
    return data;
  },
  getLevel() {
    return getCreditLevel(this.getData().score);
  },
};

export default creditService;
