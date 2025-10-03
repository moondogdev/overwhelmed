import { Category, ChecklistSection, TimeLogSession, Settings, Task } from './types';

export const formatTime = (ms: number): string => {
  if (typeof ms !== 'number' || !isFinite(ms)) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const formatTimestamp = (ts: number): string => {
  if (typeof ts !== 'number') return 'N/A';
  return new Date(ts).toLocaleString();
};

export const formatDate = (ts: number): string => {
  if (typeof ts !== 'number') return 'N/A';
  return new Date(ts).toLocaleDateString();
};

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatTimestampForInput = (ts: number | undefined): string => {
  if (!ts) return '';
  const date = new Date(ts);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 16);
};

export const parseInputTimestamp = (datetime: string): number => {
  return new Date(datetime).getTime();
};

export const getRelativeDateHeader = (dateStr: string): string => {
  // This function now correctly handles timezones and day boundaries.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // The dateStr is in 'YYYY-MM-DD' format from UTC. We need to parse it as such.
  const taskDate = new Date(dateStr + 'T00:00:00Z'); // Treat as UTC midnight
  const localTaskDate = new Date(taskDate.getUTCFullYear(), taskDate.getUTCMonth(), taskDate.getUTCDate());

  const diffTime = localTaskDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  return localTaskDate.toLocaleDateString(undefined, options);
};

export const getContrastColor = (hexColor: string): string => {
  if (!hexColor) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export const getFontSize = (index: number, total: number, settings: Settings) => {
  if (total <= 1) {
    return settings.maxFontSize;
  }
  const size = settings.maxFontSize - (index / (total - 1)) * (settings.maxFontSize - settings.minFontSize);
  return Math.round(size);
};

export const getNewTaskPosition = (canvasWidth: number, canvasHeight: number, newTaskMetrics: { width: number, height: number }, tasksRef: React.RefObject<Task[]>) => {
  if (!canvasWidth || !canvasHeight) {
    return { x: 320, y: 320 };
  }
  const padding = 50;
  let placementAttempts = 0;

  const checkCollision = (x: number, y: number) => {
    for (const placedTask of tasksRef.current) {
      if (!placedTask.width || !placedTask.height) continue;
      const newTaskRect = { left: x - newTaskMetrics.width / 2, right: x + newTaskMetrics.width / 2, top: y - newTaskMetrics.height, bottom: y };
      const placedTaskRect = { left: placedTask.x - placedTask.width / 2, right: placedTask.x + placedTask.width / 2, top: placedTask.y - placedTask.height, bottom: placedTask.y };

      if (newTaskRect.left < placedTaskRect.right && newTaskRect.right > placedTaskRect.left && newTaskRect.top < placedTaskRect.bottom && newTaskRect.bottom > placedTaskRect.top) {
        return true;
      }
    }
    return false;
  };

  while (placementAttempts < 500) {
    const halfWidth = newTaskMetrics.width / 2;
    const x = padding + halfWidth + Math.random() * (canvasWidth - (padding + halfWidth) * 2);
    const halfHeight = newTaskMetrics.height / 2;
    const y = padding + halfHeight + Math.random() * (canvasHeight - (padding + halfHeight) * 2);
    if (!checkCollision(x, y)) {
      return { x, y };
    }
    placementAttempts++;
  }
  return { x: Math.random() * canvasWidth, y: Math.random() * canvasHeight };
};

export const formatChecklistForCopy = (sections: ChecklistSection[]): string => {
  let output = '';
  for (const section of sections) {
    const completedCount = section.items.filter(item => item.isCompleted).length;
    const totalCount = section.items.length;
    output += `${section.title} (${completedCount}/${totalCount}):\n`;
    for (const item of section.items) {
      const status = item.isCompleted ? '[✔]' : '[✗]';
      output += `  ${status} ${item.text}\n`;
      if (item.response) {
        output += `      Response: ${item.response}\n`;
      }
    }
    output += '\n';
  }
  return output.trim();
};

export const formatChecklistSectionRawForCopy = (section: ChecklistSection): string => {
  return section.items.map(item => item.text).join('\n');
};

export const extractUrlFromText = (text: string): string | null => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
};

export const moveCategory = (categories: Category[], categoryId: number, direction: 'up' | 'down'): Category[] => {
  const newCategories = [...categories];
  const category = newCategories.find(c => c.id === categoryId);
  if (!category) return categories;
  const siblings = newCategories.filter(c => c.parentId === category.parentId);
  const currentIndex = siblings.findIndex(c => c.id === categoryId);
  if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === siblings.length - 1)) {
    return categories;
  }
  const swapWithIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  const swapWithCategory = siblings[swapWithIndex];
  const originalIndex = newCategories.findIndex(c => c.id === categoryId);
  const originalSwapWithIndex = newCategories.findIndex(c => c.id === swapWithCategory.id);
  [newCategories[originalIndex], newCategories[originalSwapWithIndex]] = [newCategories[originalSwapWithIndex], newCategories[originalIndex]];
  return newCategories;
};

export const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return 0;
  }
  const [hours, minutes, seconds] = parts;
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
};

export const formatTimeLogSessionForCopy = (session: TimeLogSession): string => {
  let output = `${session.title}\n`;
  output += `Total Duration: ${formatTime(session.entries.reduce((acc, entry) => acc + entry.duration, 0))}\n`;
  output += '-----------------\n';
  for (const entry of session.entries) {
    output += `${entry.description}: ${formatTime(entry.duration)}\n`;
  }
  return output;
};

export const calculateNextOccurrence = (task: Task): Date | null => {
  if (!task.isRecurring && !task.isDailyRecurring && !task.isWeeklyRecurring && !task.isMonthlyRecurring && !task.isYearlyRecurring) {
    return null;
  }

  const now = Date.now();
  let nextDate: Date;

  // For fixed intervals, the base is the *current* due date.
  // If no due date, it's based on now.
  if (task.isDailyRecurring || task.isWeeklyRecurring || task.isMonthlyRecurring || task.isYearlyRecurring) {
    nextDate = new Date(task.completeBy || now);
    if (task.isDailyRecurring) nextDate.setDate(nextDate.getDate() + 1);
    else if (task.isWeeklyRecurring) nextDate.setDate(nextDate.getDate() + 7);
    else if (task.isMonthlyRecurring) nextDate.setMonth(nextDate.getMonth() + 1);
    else if (task.isYearlyRecurring) nextDate.setFullYear(nextDate.getFullYear() + 1);
  } 
  // For generic "re-occurs on complete", the next due date is based on the original duration from NOW.
  else if (task.isRecurring && task.completeBy && task.createdAt) {
    const originalDuration = task.completeBy - task.createdAt;
    nextDate = new Date(now + originalDuration);
  } else {
    return null; // Not enough info to calculate
  }

  return nextDate;
};