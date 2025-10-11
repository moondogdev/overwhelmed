import { Category, ChecklistSection, TimeLogSession, Settings, Task, ChecklistItem, RichTextBlock, TimeLogEntry } from './types';

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

export const formatChecklistForCopy = (sections: ChecklistSection[]): string => {
  let output = '';
  for (const section of sections) {
    const completedCount = section.items.filter(item => item.isCompleted).length;
    const totalCount = section.items.length;
    output += `${section.title} (${completedCount}/${totalCount}):\n`;
    for (const item of section.items) {
      const indent = '  '.repeat(1 + (item.level || 0));
      const status = item.isCompleted ? '[✔]' : '[✗]';
      output += `${indent}${status} ${item.text}\n`;
      if (item.response) {
        const responseIndent = '  '.repeat(2 + (item.level || 0));
        output += `${responseIndent}  Response: ${item.response}\n`;
      }
    }
    output += '\n';
  }
  return output.trim();
};

export const formatChecklistSectionRawForCopy = (section: ChecklistSection): string => {
  return section.items.map(item => item.text).join('\n');
};

export const formatChecklistItemsForRawCopy = (items: ChecklistItem[]): string => {
  return items.map(item => {
    const level = item.level || 0;
    if (level === 0) {
      return item.text;
    }
    // Use 2 spaces per indent level for consistency with the parsing logic.
    const indent = '  '.repeat(level);
    // Use a hyphen for level 1 and an asterisk for level 2+ for style.
    const prefix = level === 1 ? '- ' : '* ';
    return `${indent}${prefix}${item.text}`;
  }).join('\n');
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

export const indentChecklistItem = (sections: (ChecklistSection | RichTextBlock)[], sectionId: number, itemId: number): (ChecklistSection | RichTextBlock)[] => {
  const newSections = JSON.parse(JSON.stringify(sections));
  const sectionIndex = newSections.findIndex((s: ChecklistSection | RichTextBlock) => 'items' in s && s.id === sectionId);
  if (sectionIndex === -1) return sections;
  const section = newSections[sectionIndex] as ChecklistSection;

  const itemIndex = section.items.findIndex((i: any) => i.id === itemId);
  // Cannot indent the first item or an item that doesn't exist.
  if (itemIndex <= 0) return sections;

  const currentItem = section.items[itemIndex];
  const potentialParent = section.items[itemIndex - 1];

  // An item can only be indented under an item of the same or higher level.
  // The new level can be at most the parent's level + 1.
  const currentLevel = currentItem.level || 0;
  const parentLevel = potentialParent.level || 0;

  if (parentLevel >= currentLevel) {
    currentItem.parentId = potentialParent.id;
    currentItem.level = parentLevel + 1;
  } else {
    // If trying to indent under a deeper item, match the parent's level.
    currentItem.parentId = potentialParent.parentId;
    currentItem.level = parentLevel;
  }

  newSections[sectionIndex] = section;
  return newSections;
};

export const formatTimeLogSessionsForCsv = (sessions: TimeLogSession[] | undefined): string => {
  if (!sessions || sessions.length === 0) return '';
  return sessions.map((session: TimeLogSession) => {
    const totalDuration = session.entries.reduce((acc: number, entry: TimeLogEntry) => acc + entry.duration, 0);
    const header = `Session: ${session.title} (Total: ${formatTime(totalDuration)})`;
    const entries = session.entries.map((entry: TimeLogEntry) => `  - ${entry.description}: ${formatTime(entry.duration)}`).join('\n');
    return `${header}\n${entries}`;
  }).join('\n\n');
};

export const formatChecklistForCsv = (checklist: (ChecklistSection | RichTextBlock | ChecklistItem)[] | undefined): string => {
  if (!checklist || checklist.length === 0) return '';

  // Handle legacy format
  if ('isCompleted' in checklist[0]) {
    return (checklist as ChecklistItem[]).map(item => `${item.isCompleted ? '[x]' : '[ ]'} ${item.text}`).join('\n');
  }

  // Handle modern format with sections and rich text blocks
  return (checklist as (ChecklistSection | RichTextBlock)[]).map(block => {
    if ('items' in block) { // It's a ChecklistSection
      const header = `### ${block.title}`;
      const items = block.items.map((item: ChecklistItem) => `${item.isCompleted ? '[x]' : '[ ]'} ${item.text}`).join('\n');
      return `${header}\n${items}`;
    }
    return `[Rich Text]: ${block.content.replace(/<[^>]*>?/gm, ' ')}`; // It's a RichTextBlock, strip HTML for CSV
  }).join('\n');
};

const getAllDescendantIds = (items: ChecklistSection['items'], parentId: number): number[] => {
  const children = items.filter((i: ChecklistItem) => i.parentId === parentId);
  let descendantIds: number[] = children.map(c => c.id);
  for (const child of children) {
    descendantIds = descendantIds.concat(getAllDescendantIds(items, child.id));
  }
  return descendantIds;
};

export const deleteChecklistItemAndChildren = (sections: (ChecklistSection | RichTextBlock)[], sectionId: number, itemId: number): (ChecklistSection | RichTextBlock)[] => {
  const newSections = JSON.parse(JSON.stringify(sections));
  const sectionIndex = newSections.findIndex((s: ChecklistSection | RichTextBlock) => 'items' in s && s.id === sectionId);
  if (sectionIndex === -1) return sections;

  const section = newSections[sectionIndex] as ChecklistSection;
  const descendantIds = getAllDescendantIds(section.items, itemId);
  const idsToDelete = new Set([itemId, ...descendantIds]);

  section.items = section.items.filter((item: ChecklistItem) => !idsToDelete.has(item.id));

  newSections[sectionIndex] = section;
  return newSections;
};

export const moveChecklistItemAndChildren = (sections: (ChecklistSection | RichTextBlock)[], sectionId: number, itemId: number, direction: 'up' | 'down'): (ChecklistSection | RichTextBlock)[] => {
  const newSections = JSON.parse(JSON.stringify(sections));
  const sectionIndex = newSections.findIndex((s: ChecklistSection | RichTextBlock) => 'items' in s && s.id === sectionId);
  if (sectionIndex === -1) return sections;
  const section = newSections[sectionIndex] as ChecklistSection;

  const itemIndex = section.items.findIndex((i: any) => i.id === itemId);
  if (itemIndex === -1) return sections;

  const descendantIds = getAllDescendantIds(section.items, itemId);
  const blockIds = [itemId, ...descendantIds];
  
  // Extract the block of items to move
  const block = section.items.filter((item: any) => blockIds.includes(item.id));
  // Get the remaining items
  const remainingItems = section.items.filter((item: any) => !blockIds.includes(item.id));

  const currentItem = section.items[itemIndex];
  const currentLevel = currentItem.level || 0;

  if (direction === 'up') {
    if (itemIndex === 0) return sections; // Already at the top
    // Find the first item above the block that is at the same or a lower level
    let targetIndex = itemIndex - 1;
    while (targetIndex > 0 && (section.items[targetIndex].level || 0) > currentLevel) {
      targetIndex--;
    }
    const insertionIndex = remainingItems.findIndex((i: any) => i.id === section.items[targetIndex].id);
    remainingItems.splice(insertionIndex, 0, ...block);
  } else { // 'down'
    const lastItemInBlockIndex = section.items.findIndex((i: any) => i.id === block[block.length - 1].id);
    if (lastItemInBlockIndex === section.items.length - 1) return sections; // Already at the bottom
    
    const itemAfterBlock = section.items[lastItemInBlockIndex + 1];
    const insertionIndex = remainingItems.findIndex((i: any) => i.id === itemAfterBlock.id) + 1;
    remainingItems.splice(insertionIndex, 0, ...block);
  }

  section.items = remainingItems;
  newSections[sectionIndex] = section;
  return newSections;
};

export const outdentChecklistItem = (sections: (ChecklistSection | RichTextBlock)[], sectionId: number, itemId: number): (ChecklistSection | RichTextBlock)[] => {
  const newSections = JSON.parse(JSON.stringify(sections));
  const sectionIndex = newSections.findIndex((s: ChecklistSection | RichTextBlock) => 'items' in s && s.id === sectionId);
  if (sectionIndex === -1) return sections;
  const section = newSections[sectionIndex] as ChecklistSection;

  const itemIndex = section.items.findIndex((i: any) => i.id === itemId);
  if (itemIndex === -1) return sections;

  const currentItem = section.items[itemIndex];
  const currentLevel = currentItem.level || 0;

  // Cannot outdent a top-level item.
  if (currentLevel === 0) return sections;

  // Find the original parent.
  const parent = section.items.find((i: any) => i.id === currentItem.parentId);

  if (parent) {
    // The new parent is the original parent's parent.
    currentItem.parentId = parent.parentId;
    currentItem.level = (parent.level || 0);
  } else {
    // If for some reason the parent isn't found, move to top level.
    currentItem.parentId = null;
    currentItem.level = 0;
  }

  newSections[sectionIndex] = section;
  return newSections;
};