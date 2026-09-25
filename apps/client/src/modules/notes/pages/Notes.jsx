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

/** Filter setter handlers sharing a single setFilters updater. */
const makeFilterSetters = (setFilters) => ({
  handleSearchChange: (value) =>
    setFilters((prev) => ({ ...prev, searchTerm: value })),
  handleStatusChange: (value) =>
    setFilters((prev) => ({ ...prev, statusCode: value })),
  handleFavoriteFilter: (value) =>
    setFilters((prev) => ({ ...prev, isFavorite: value })),
  handleScopeChange: (value) =>
    setFilters((prev) => ({ ...prev, scope: value })),
});

/** Hashtag CRUD handlers; failures are logged, not thrown. */
const makeHashtagHandlers = ({
  createHashtag,
  updateHashtag,
  deleteHashtag,
}) => ({
  handleCreateHashtag: async ({ name }) => {
    try {
      await createHashtag({ name }).unwrap();
    } catch (error) {
      console.error('Error creating hashtag:', error);
    }
  },
  handleEditHashtag: async ({ id, name }) => {
    try {
      await updateHashtag({ id, body: { name } }).unwrap();
    } catch (error) {
      console.error('Error updating hashtag:', error);
    }
  },
  handleDeleteHashtag: async ({ id }) => {
    try {
      await deleteHashtag(id).unwrap();
    } catch (error) {
      console.error('Error deleting hashtag:', error);
    }
  },
});

/** Success alert props for create/edit confirmations. */
const buildSuccessAlertProps = ({
  t,
  titleKey,
  messageKey,
  setOpenAlertDialog,
}) => ({
  alertTitle: t(titleKey),
  alertMessage: t(messageKey),
  cancel: false,
  success: true,
  onSuccess: () => {
    setOpenAlertDialog(false);
  },
  variantSuccess: 'info',
});

/**
 * Create/edit handlers that show a success alert, plus the filter-reset
 * and hashtag-selection handlers.
 */
const makeNoteMutationHandlers = ({ t, page }) => ({
  handleReset: () => {
    page.setFilters({
      searchTerm: '',
      statusCode: '',
      isFavorite: false,
      scope: 'mine',
    });
    page.setSelectedHashtagIds([]);
  },

  handleCreateNote: async ({
    title,
    content,
    status,
    hashtagIds,
    isFavorite,
  }) => {
    await page
      .createNote({
        title,
        content,
        columnId: status.id,
        hashtagIds,
        isFavorite,
      })
      .unwrap();

    page.setAlertProps(
      buildSuccessAlertProps({
        t,
        titleKey: 'add_record',
        messageKey: 'added_successfully',
        setOpenAlertDialog: page.setOpenAlertDialog,
      })
    );
    page.setOpenAlertDialog(true);
  },

  handleEditNote: async ({ id, body }) => {
    if (Object.keys(body).length > 0) {
      await page.updateNoteById({ id, body }).unwrap();
    }

    page.setAlertProps(
      buildSuccessAlertProps({
        t,
        titleKey: 'update_record',
        messageKey: 'updated_successfully',
        setOpenAlertDialog: page.setOpenAlertDialog,
      })
    );
    page.setOpenAlertDialog(true);
  },

  handleHashtagSelectionChange: (ids) => {
    page.setSelectedHashtagIds(ids);
    page.setFilters((prev) => ({
      ...prev,
      hashtagId: ids.length > 0 ? ids : undefined,
    }));
  },
});

/** Delete-confirmation handler for a note. */
const makeDeleteNoteHandler =
  ({ t, deleteNoteById, setAlertProps, setOpenAlertDialog }) =>
  async (noteId) => {
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

/** Drag-and-drop handlers for moving notes between columns. */
const buildDragHandlers = ({ dataNotes, updateNoteColumId }) => ({
  handleDragStart: (e, noteId, sourceColumnCode) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ noteId, sourceColumnCode })
    );
  },
  handleDragOver: (e) => {
    const types = Array.from(e.dataTransfer.types);
    if (types.includes('application/json')) {
      e.preventDefault();
    }
  },
  handleDrop: async (e, targetColumnCode) => {
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
  },
});

/** Page state: filters, dialog/alert visibility and all notes/hashtag queries. */
function useNotesPageData(location) {
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [alertProps, setAlertProps] = useState({});
  const [selectedHashtagIds, setSelectedHashtagIds] = useState([]);
  const dispatch = useDispatch();
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

  const isLoadingPage =
    isLoadingNotes ||
    isLoadingPut ||
    isLoadingPost ||
    isLoadingDelete ||
    isLoadingPostHashT ||
    isLoadingDeleteHashT ||
    isLoadingPutHashT ||
    isLoadingPutCard ||
    isFetchingNotes;

  return {
    openAlertDialog,
    setOpenAlertDialog,
    open,
    setOpen,
    alertProps,
    setAlertProps,
    selectedHashtagIds,
    setSelectedHashtagIds,
    filters,
    setFilters,
    dataNotes,
    isLoadingPage,
    createNote,
    updateNoteColumId,
    updateNoteById,
    deleteNoteById,
    createHashtag,
    updateHashtag,
    deleteHashtag,
  };
}

/** Static page layout for the notes board. */
const buildNotesLayout = ({
  t,
  dataNotes,
  filters,
  selectedHashtagIds,
  isLoadingPage,
  filterHandlers,
  hashtagHandlers,
  dragHandlers,
  noteHandlers,
  dialog,
  alert,
}) => (
  <>
    <BackDashBoard link={'/home'} moduleName={t('notes')} />
    <div className="relative w-full px-4">
      {isLoadingPage && <Spinner />}
      <div className="w-full space-y-6">
        <div className="col-span-2 row-span-1 md:col-span-5">
          <NotesFilters
            onSearch={filterHandlers.handleSearchChange}
            onSearchStatus={filterHandlers.handleStatusChange}
            onFavoriteFilter={filterHandlers.handleFavoriteFilter}
            filters={filters}
            handleReset={noteHandlers.handleReset}
            setOpen={dialog.setOpen}
            selectedHashtagIds={selectedHashtagIds}
            onHashtagSelectionChange={noteHandlers.handleHashtagSelectionChange}
            onCreateHashtag={hashtagHandlers.handleCreateHashtag}
            onEditHashtag={hashtagHandlers.handleEditHashtag}
            onDeleteHashtag={hashtagHandlers.handleDeleteHashtag}
            onScopeChange={filterHandlers.handleScopeChange}
            scope={filters.scope}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <NotesCreateDialog
            onCreateNote={noteHandlers.handleCreateNote}
            open={dialog.open}
            setOpen={dialog.setOpen}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-6 p-4 min-h-[700px] w-full">
          <NotesColumn
            data={dataNotes?.data}
            onDragStart={dragHandlers.handleDragStart}
            onDragOver={dragHandlers.handleDragOver}
            onDrop={dragHandlers.handleDrop}
            onDeleteNote={noteHandlers.handleDeleteNote}
            onEditNote={noteHandlers.handleEditNote}
          />
        </div>
        <AlertDialogComponent
          openAlertDialog={alert.openAlertDialog}
          setOpenAlertDialog={alert.setOpenAlertDialog}
          alertProps={alert.alertProps}
        />
      </div>
    </div>
  </>
);

export default function Notes() {
  const { t } = useTranslation();
  const location = useLocation();
  const page = useNotesPageData(location);

  const filterHandlers = makeFilterSetters(page.setFilters);
  const hashtagHandlers = makeHashtagHandlers({
    createHashtag: page.createHashtag,
    updateHashtag: page.updateHashtag,
    deleteHashtag: page.deleteHashtag,
  });
  const dragHandlers = buildDragHandlers({
    dataNotes: page.dataNotes,
    updateNoteColumId: page.updateNoteColumId,
  });
  const noteHandlers = {
    ...makeNoteMutationHandlers({ t, page }),
    handleDeleteNote: makeDeleteNoteHandler({
      t,
      deleteNoteById: page.deleteNoteById,
      setAlertProps: page.setAlertProps,
      setOpenAlertDialog: page.setOpenAlertDialog,
    }),
  };

  return buildNotesLayout({
    t,
    dataNotes: page.dataNotes,
    filters: page.filters,
    selectedHashtagIds: page.selectedHashtagIds,
    isLoadingPage: page.isLoadingPage,
    filterHandlers,
    hashtagHandlers,
    dragHandlers,
    noteHandlers,
    dialog: { open: page.open, setOpen: page.setOpen },
    alert: {
      openAlertDialog: page.openAlertDialog,
      setOpenAlertDialog: page.setOpenAlertDialog,
      alertProps: page.alertProps,
    },
  });
}
