export function formatTime(dateStr) {
  if (!dateStr) return '未知';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function getWeekdayName(day) {
  return ['日', '一', '二', '三', '四', '五', '六'][day];
}
