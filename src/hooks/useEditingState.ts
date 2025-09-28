import React, { useState, useCallback } from 'react';
import { Word } from '../types';

interface UseEditingStateProps {
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
}

export function useEditingState({ words, setWords }: UseEditingStateProps) {
  const [editingWordId, setEditingWordId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const handleEdit = useCallback((word: Word) => {
    setEditingWordId(word.id);
    setEditingText(word.text);
  }, []);

  const handleEditChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEditingText(event.target.value);
  }, []);

  const handleEditKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>, wordId: number) => {
    if (event.key === 'Enter') {
      const newWords = words.map(word =>
        word.id === wordId ? { ...word, text: editingText.trim() } : word
      );
      setWords(newWords);
      setEditingWordId(null);
      setEditingText('');
    } else if (event.key === 'Escape') {
      setEditingWordId(null);
      setEditingText('');
    }
  }, [words, setWords, editingText]);

  return {
    editingWordId, setEditingWordId,
    editingText, setEditingText,
    handleEdit, handleEditChange, handleEditKeyDown,
  };
}