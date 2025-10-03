import React, { useState, useCallback } from 'react';
import { Task } from '../types';

interface UseEditingStateProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export function useEditingState({ tasks, setTasks }: UseEditingStateProps) {
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const handleEdit = useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  }, []);

  const handleEditChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEditingText(event.target.value);
  }, []);

  const handleEditKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>, taskId: number) => {
    if (event.key === 'Enter') {
      const newTasks = tasks.map(task =>
        task.id === taskId ? { ...task, text: editingText.trim() } : task
      );
      setTasks(newTasks);
      setEditingTaskId(null);
      setEditingText('');
    } else if (event.key === 'Escape') {
      setEditingTaskId(null);
      setEditingText('');
    }
  }, [tasks, setTasks, editingText]);

  return {
    editingTaskId, setEditingTaskId,
    editingText, setEditingText,
    handleEdit, handleEditChange, handleEditKeyDown,
  };
}