import { useState, useEffect, useRef, useCallback } from 'react';
import { Task } from '../types';

interface UseCoreTaskStateProps {
  initialTasks?: Task[];
  initialCompletedTasks?: Task[];
  showToast: (message: string, duration?: number) => void;
}

export function useCoreTaskState({
  initialTasks = [],
  initialCompletedTasks = [],
  showToast,
}: UseCoreTaskStateProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [completedTasks, setCompletedTasks] = useState<Task[]>(initialCompletedTasks);
  const nextId = useRef(0);

  useEffect(() => {
    const allTasks = [...tasks, ...completedTasks];
    if (allTasks.length > 0) {
      const maxId = allTasks.reduce((max, task) => Math.max(max, Math.floor(task.id)), 0);
      nextId.current = maxId + 1;
    } else {
      nextId.current = 1;
    }
  }, [tasks, completedTasks]);

  const getNextId = () => nextId.current++;

  const handleSyncIds = useCallback(() => {
    const idMap = new Map<number, number>();
    let newIdCounter = 1;

    const reIdTasks = (taskArray: Task[]): Task[] => {
      return taskArray.map(task => {
        const newId = newIdCounter++;
        idMap.set(task.id, newId);
        return { ...task, id: newId };
      });
    };

    const newTasks = reIdTasks(tasks);
    const newCompletedTasks = reIdTasks(completedTasks);

    const updateLinkedIds = (taskArray: Task[]): Task[] => {
      return taskArray.map(task => {
        if (task.startsTaskIdOnComplete && idMap.has(task.startsTaskIdOnComplete)) {
          return { ...task, startsTaskIdOnComplete: idMap.get(task.startsTaskIdOnComplete) };
        }
        return task;
      });
    };

    setTasks(updateLinkedIds(newTasks));
    setCompletedTasks(updateLinkedIds(newCompletedTasks));
    nextId.current = newIdCounter;
    showToast('All task IDs have been synchronized successfully!', 3000);
  }, [tasks, completedTasks, setTasks, setCompletedTasks, showToast]);

  return {
    tasks, setTasks,
    completedTasks, setCompletedTasks,
    getNextId,
    handleSyncIds,
  };
}