export function calcMatchRate(userTags, targetTags) {
  if (!targetTags || targetTags.length === 0) return 70;
  const common = userTags.filter((t) => targetTags.includes(t));
  return Math.min(99, Math.floor(60 + (common.length / Math.max(targetTags.length, 1)) * 40));
}

export function calcSparkDays(lastInteractionDate) {
  if (!lastInteractionDate) return 0;
  const diff = Date.now() - new Date(lastInteractionDate).getTime();
  return Math.floor(diff / 86400000);
}
