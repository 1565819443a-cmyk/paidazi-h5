import storageService from './storageService';
import { creditRules, getCreditLevel } from '../mock/credit';

const KEY = 'creditData_v2';

function defaultCredit() {
  return {
    score: 80,
    logs: [],
    dimensions: creditRules.dimensions,
    rankPercent: null,
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
