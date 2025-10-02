import { useState, useCallback, useRef, useEffect } from 'react';
import { InboxMessage } from '../types';

interface UseInboxStateProps {
  initialInbox?: InboxMessage[];
  initialArchived?: InboxMessage[];
  initialTrashed?: InboxMessage[];
  showToast: (message: string, duration?: number) => void;
  setIsDirty: (isDirty: boolean) => void;
}

export function useInboxState({
  initialInbox = [],
  initialArchived = [],
  initialTrashed = [],
  showToast,
  setIsDirty,
}: UseInboxStateProps) {
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>(initialInbox);
  const [archivedMessages, setArchivedMessages] = useState<InboxMessage[]>(initialArchived);
  const [trashedMessages, setTrashedMessages] = useState<InboxMessage[]>(initialTrashed);

  // Refs to hold the latest state for background processes
  const inboxMessagesRef = useRef(inboxMessages);
  const archivedMessagesRef = useRef(archivedMessages);
  const trashedMessagesRef = useRef(trashedMessages);

  // Keep refs updated with the latest state
  useEffect(() => {
    inboxMessagesRef.current = inboxMessages;
  }, [inboxMessages]);
  useEffect(() => {
    archivedMessagesRef.current = archivedMessages;
  }, [archivedMessages]);
  useEffect(() => {
    trashedMessagesRef.current = trashedMessages;
  }, [trashedMessages]);

  const handleToggleImportant = useCallback((messageId: number) => {
    let isNowImportant: boolean;
    setInboxMessages(prevMessages => {
      return prevMessages.map(msg => {
        if (msg.id === messageId) {
          isNowImportant = !msg.isImportant;
          return { ...msg, isImportant: isNowImportant };
        }
        return msg;
      });
    });
    showToast(isNowImportant ? "Message marked as important." : "Message unmarked as important.");
    setIsDirty(true);
  }, [showToast, setIsDirty]);

  const handleArchiveInboxMessage = useCallback((messageId: number) => {
    const messageToArchive = inboxMessages.find(msg => msg.id === messageId);
    if (!messageToArchive) return;
    setArchivedMessages(prev => [{ ...messageToArchive, isArchived: true }, ...prev]);
    setInboxMessages(prev => prev.filter(msg => msg.id !== messageId));
    showToast("Message archived.");
    setIsDirty(true);
  }, [inboxMessages, showToast, setIsDirty]);

  const handleUnarchiveInboxMessage = useCallback((messageId: number) => {
    const messageToUnarchive = archivedMessages.find(msg => msg.id === messageId);
    if (!messageToUnarchive) return;
    setInboxMessages(prev => [{ ...messageToUnarchive, isArchived: false }, ...prev]);
    setArchivedMessages(prev => prev.filter(msg => msg.id !== messageId));
    showToast("Message un-archived.");
    setIsDirty(true);
  }, [archivedMessages, showToast, setIsDirty]);

  const handleRestoreFromTrash = useCallback((messageId: number) => {
    const messageToRestore = trashedMessages.find(msg => msg.id === messageId);
    if (!messageToRestore) return;
    setInboxMessages(prev => [messageToRestore, ...prev]);
    setTrashedMessages(prev => prev.filter(msg => msg.id !== messageId));
    showToast("Message restored from trash.");
    setIsDirty(true);
  }, [trashedMessages, showToast, setIsDirty]);

  const handleDeletePermanently = useCallback((messageId: number) => {
    setTrashedMessages(prev => prev.filter(msg => msg.id !== messageId));
    showToast("Message permanently deleted.");
    setIsDirty(true);
  }, [showToast, setIsDirty]);

  const handleEmptyTrash = useCallback(() => {
    if (window.confirm(`Are you sure you want to permanently delete all ${trashedMessages.length} items in the trash? This cannot be undone.`)) {
      setTrashedMessages([]);
      showToast("Trash has been emptied.");
      setIsDirty(true);
    }
  }, [trashedMessages.length, showToast, setIsDirty]);

  const handleDismissArchivedMessage = useCallback((messageId: number) => {
    const messageToTrash = archivedMessages.find(m => m.id === messageId);
    if (!messageToTrash) return;
    setTrashedMessages(prev => [messageToTrash, ...prev]);
    setArchivedMessages(prev => prev.filter(m => m.id !== messageId));
    showToast("Message moved from archive to trash.");
    setIsDirty(true);
  }, [archivedMessages, showToast, setIsDirty]);

  const handleRestoreAllFromTrash = useCallback(() => {
    if (window.confirm('Are you sure you want to restore all items from the trash?')) {
      setInboxMessages(prev => [...prev, ...trashedMessages]);
      setTrashedMessages([]);
      showToast('All messages restored from trash.');
      setIsDirty(true);
    }
  }, [trashedMessages, showToast, setIsDirty]);

  const handleTrashAllArchived = useCallback(() => {
    if (window.confirm(`Are you sure you want to move all ${archivedMessages.length} archived messages to the trash?`)) {
      setTrashedMessages(prev => [...prev, ...archivedMessages]);
      setArchivedMessages([]);
      showToast('All archived messages moved to trash.');
      setIsDirty(true);
    }
  }, [archivedMessages, showToast, setIsDirty]);

  const handleDismissInboxMessage = useCallback((messageId: number) => {
    const messageToTrash = inboxMessages.find(m => m.id === messageId);
    if (!messageToTrash) return;
    if (messageToTrash.isImportant) {
      showToast("Cannot dismiss an important message.");
      return;
    }
    setTrashedMessages(prev => [messageToTrash, ...prev]);
    setInboxMessages(prev => prev.filter(m => m.id !== messageId));
    showToast("Message moved to trash.");
    setIsDirty(true);
  }, [inboxMessages, showToast, setIsDirty]);

  const handleDismissAllInboxMessages = useCallback(() => {
    const messagesToTrash = inboxMessages.filter(m => !m.isImportant);
    setTrashedMessages(prev => [...messagesToTrash, ...prev]);
    setInboxMessages(prev => prev.filter(m => m.isImportant));
    showToast(`Moved ${messagesToTrash.length} non-important message(s) to trash.`);
    setIsDirty(true);
  }, [inboxMessages, showToast, setIsDirty]);

  return {
    inboxMessages, setInboxMessages,
    archivedMessages, setArchivedMessages,
    trashedMessages, setTrashedMessages,
    inboxMessagesRef,
    archivedMessagesRef,
    trashedMessagesRef,
    handleToggleImportant,
    handleArchiveInboxMessage,
    handleUnarchiveInboxMessage,
    handleRestoreFromTrash,
    handleDeletePermanently,
    handleEmptyTrash,
    handleDismissArchivedMessage,
    handleRestoreAllFromTrash,
    handleTrashAllArchived,
    handleDismissInboxMessage,
    handleDismissAllInboxMessages,
  };
}