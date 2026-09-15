import { creditRules } from '../mock/credit';

export function getCreditLevelInfo(score) {
  return creditRules.levels.find((l) => score >= l.min) || creditRules.levels[creditRules.levels.length - 1];
}

export function getCreditColor(score) {
  return getCreditLevelInfo(score).color;
}

export function getCreditBadge(score) {
  return getCreditLevelInfo(score).badge;
}

export function formatCreditScore(score) {
  return Math.max(0, Math.min(100, score));
}
