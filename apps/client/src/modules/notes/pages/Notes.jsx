import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { Spinner } from '@/components/loader/Spinner';
import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import {
  useGetAllNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteColumIdMutation,
  useUpdateNoteByIdMutation,
  useDeleteNoteByIdMutation,
  useCreateHashtagMutation,
  useUpdateHashtagMutation,
  useDeleteHashtagMutation,
} from '../api/notesAPI';
import notesApi from '../api/notesAPI';
import { useDispatch } from 'react-redux';
import {
  NotesFilters,
  NotesColumn,
  NotesCreateDialog,
} from '../components/index';

import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { useLocation } from 'react-router';
import { useSocket } from '@/hooks';
import { useMentionNotifications } from '@/hooks/useMentionNotifications';

export default function Notes() {
  const { t } = useTranslation();
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [alertProps, setAlertProps] = useState({});
  const [selectedHashtagIds, setSelectedHashtagIds] = useState([]);
  const location = useLocation();
  const { socket } = useSocket();

  // Activar notificaciones de menciones en tiempo real via WebSocket
  useMentionNotifications();

  const initialFilters = useMemo(() => {
    return {
      searchTerm: '',
      statusCode: location.state?.filter ?? '',
      isFavorite: false,
      scope: location.state?.scope ?? 'mine',
    };
  }, [location.state?.filter, location.state?.scope]);
  const [filters, setFilters] = useState(initialFilters);
  const dispatch = useDispatch();

  // Invalidar cache de Notes cuando se recibe mention:read
  useEffect(() => {
    if (!socket) return;
    const handleMentionRead = () => {
      dispatch(notesApi.util.invalidateTags(['Notes']));
    };
    socket.on('mention:read', handleMentionRead);
    return () => {
      socket.off('mention:read', handleMentionRead);
    };
  }, [socket, dispatch]);

  const {
    data: dataNotes = { data: [] },
    isLoading: isLoadingNotes,
    isFetching: isFetchingNotes,
  } = useGetAllNotesQuery(filters);

  const [createNote, { isLoading: isLoadingPost }] = useCreateNoteMutation();

  const [updateNoteColumId, { isLoading: isLoadingPut }] =
    useUpdateNoteColumIdMutation();

  const [updateNoteById, { isLoading: isLoadingPutCard }] =
    useUpdateNoteByIdMutation();

  const [deleteNoteById, { isLoading: isLoadingDelete }] =
    useDeleteNoteByIdMutation();

  const [createHashtag, { isLoading: isLoadingPostHashT }] =
    useCreateHashtagMutation();
  const [updateHashtag, { isLoading: isLoadingPutHashT }] =
    useUpdateHashtagMutation();
  const [deleteHashtag, { isLoading: isLoadingDeleteHashT }] =
    useDeleteHashtagMutation();

  const handleDragStart = (e, noteId, sourceColumnCode) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ noteId, sourceColumnCode })
    );
  };

  const handleDragOver = (e) => {
    const types = Array.from(e.dataTransfer.types);
    if (types.includes('application/json')) {
      e.preventDefault();
    }
  };

  const handleDrop = async (e, targetColumnCode) => {
    e.preventDefault();

    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    const { noteId, sourceColumnCode } = data;
    if (!noteId || !sourceColumnCode) return;

    if (sourceColumnCode === targetColumnCode) return;

    const sourceColumn = dataNotes?.data.find(
      (col) => col.code === sourceColumnCode
    );
    const targetColumn = dataNotes?.data.find(
      (col) => col.code === targetColumnCode
    );
    const noteToMove = sourceColumn?.notes.find((note) => note.id === noteId);

    if (!noteToMove) return dataNotes?.data;

    await updateNoteColumId({
      id: noteToMove.id,
      columnId: targetColumn.id,
    }).unwrap();
  };

  const handleSearchChange = (value) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  };

  const handleStatusChange = (value) => {
    setFilters((prev) => ({ ...prev, statusCode: value }));
  };

  const handleFavoriteFilter = (value) => {
    setFilters((prev) => ({ ...prev, isFavorite: value }));
  };

  const handleScopeChange = (value) => {
    setFilters((prev) => ({ ...prev, scope: value }));
  };

  const handleReset = () => {
    setFilters({
      searchTerm: '',
      statusCode: '',
      isFavorite: false,
      scope: 'mine',
    });
    setSelectedHashtagIds([]);
  };

  const handleCreateNote = async ({
    title,
    content,
    status,
    hashtagIds,
    isFavorite,
  }) => {
    await createNote({
      title,
      content,
      columnId: status.id,
      hashtagIds,
      isFavorite,
    }).unwrap();

    setOpenAlertDialog(true);
    setAlertProps({
      alertTitle: t('add_record'),
      alertMessage: t('added_successfully'),
      cancel: false,
      success: true,
      onSuccess: () => {
        setOpenAlertDialog(false);
      },
      variantSuccess: 'info',
    });
  };

  const handleEditNote = async ({ id, body }) => {
    if (Object.keys(body).length > 0) {
      await updateNoteById({ id, body }).unwrap();
    }

    setOpenAlertDialog(true);
    setAlertProps({
      alertTitle: t('update_record'),
      alertMessage: t('updated_successfully'),
      cancel: false,
      success: true,
      onSuccess: () => {
        setOpenAlertDialog(false);
      },
      variantSuccess: 'info',
    });
  };

  const handleDeleteNote = async (noteId) => {
    setAlertProps({
      alertTitle: t('delete_record'),
      alertMessage: t('request_delete_record'),
      cancel: true,
      success: false,
      destructive: true,
      variantSuccess: '',
      variantDestructive: 'destructive',
      onSuccess: () => {},
      onDelete: async () => {
        try {
          await deleteNoteById(noteId).unwrap();

          setAlertProps({
            alertTitle: '',
            alertMessage: t('deleted_successfully'),
            cancel: false,
            success: true,
            onSuccess: () => {
              setOpenAlertDialog(false);
            },
            variantSuccess: 'info',
          });
          setOpenAlertDialog(true);
        } catch (err) {
          console.error('Error deleting:', err);
        }
      },
    });
    setOpenAlertDialog(true);
  };

  const handleHashtagSelectionChange = (ids) => {
    setSelectedHashtagIds(ids);
    setFilters((prev) => ({
      ...prev,
      hashtagId: ids.length > 0 ? ids : undefined,
    }));
  };

  const handleCreateHashtag = async ({ name }) => {
    try {
      await createHashtag({ name }).unwrap();
    } catch (error) {
      console.error('Error creating hashtag:', error);
    }
  };

  const handleEditHashtag = async ({ id, name }) => {
    try {
      await updateHashtag({ id, body: { name } }).unwrap();
    } catch (error) {
      console.error('Error updating hashtag:', error);
    }
  };

  const handleDeleteHashtag = async ({ id }) => {
    try {
      await deleteHashtag(id).unwrap();
    } catch (error) {
      console.error('Error deleting hashtag:', error);
    }
  };

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('notes')} />
      <div className="relative w-full px-4">
        {(isLoadingNotes ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isLoadingPostHashT ||
          isLoadingDeleteHashT ||
          isLoadingPutHashT ||
          isLoadingPutCard ||
          isFetchingNotes) && <Spinner />}
        <div className="w-full space-y-6">
          <div className="col-span-2 row-span-1 md:col-span-5">
            <NotesFilters
              onSearch={handleSearchChange}
              onSearchStatus={handleStatusChange}
              onFavoriteFilter={handleFavoriteFilter}
              filters={filters}
              handleReset={handleReset}
              setOpen={setOpen}
              selectedHashtagIds={selectedHashtagIds}
              onHashtagSelectionChange={handleHashtagSelectionChange}
              onCreateHashtag={handleCreateHashtag}
              onEditHashtag={handleEditHashtag}
              onDeleteHashtag={handleDeleteHashtag}
              onScopeChange={handleScopeChange}
              scope={filters.scope}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <NotesCreateDialog
              onCreateNote={handleCreateNote}
              open={open}
              setOpen={setOpen}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-6 p-4 min-h-[700px] w-full">
            <NotesColumn
              data={dataNotes?.data}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDeleteNote={handleDeleteNote}
              onEditNote={handleEditNote}
            />
          </div>
          <AlertDialogComponent
            openAlertDialog={openAlertDialog}
            setOpenAlertDialog={setOpenAlertDialog}
            alertProps={alertProps}
          />
        </div>
      </div>
    </>
  );
}
