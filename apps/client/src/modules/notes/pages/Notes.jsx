import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { Spinner } from '@/components/loader/Spinner';
import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import {
  useGetAllNotesQuery,
  useGetAllNotesColumnsQuery,
  useCreateNoteMutation,
  useUpdateNoteColumIdMutation,
  useUpdateNoteByIdMutation,
  useDeleteNoteByIdMutation,
  useCreateHashtagMutation,
  useUpdateHashtagMutation,
  useDeleteHashtagMutation,
} from '../api/notesAPI';
import {
  NotesFilters,
  NotesColumn,
  NotesCreateDialog,
} from '../components/index';
import { StatusColumn, NotesColor } from '../utils/index';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { useLocation } from 'react-router';

export default function Notes() {
  const { t } = useTranslation();
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [alertProps, setAlertProps] = useState({});
  const [selectedHashtagIds, setSelectedHashtagIds] = useState([]);
  const location = useLocation();

  const initialFilters = useMemo(() => {
    return {
      searchTerm: '',
      statusCode: location.state?.filter ?? '',
    };
  }, [location.state?.filter]);
  const [filters, setFilters] = useState(initialFilters);

  const {
    data: dataColumns = { data: [] },
    isLoading: isLoadingColumns,
    isFetching: isFetchingColumns,
  } = useGetAllNotesColumnsQuery();

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

  const [createHashtag] = useCreateHashtagMutation();
  const [updateHashtag] = useUpdateHashtagMutation();
  const [deleteHashtag] = useDeleteHashtagMutation();

  const setColor = (code) => {
    return code === StatusColumn.MEDIUM
      ? NotesColor.YELLOW
      : code === StatusColumn.HIGH
        ? NotesColor.RED
        : NotesColor.GREEN;
  };

  const handleDragStart = (e, noteId, sourceColumnCode) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ noteId, sourceColumnCode })
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetColumnCode) => {
    e.preventDefault();

    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    const { noteId, sourceColumnCode } = data;

    if (sourceColumnCode === targetColumnCode) return;

    const newColor = setColor(targetColumnCode);

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
      color: newColor,
    }).unwrap();
  };

  const handleSearchChange = (value) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  };

  const handleStatusChange = (value) => {
    setFilters((prev) => ({ ...prev, statusCode: value }));
  };

  const handleReset = () => {
    setFilters({ searchTerm: '', statusCode: '' });
    setSelectedHashtagIds([]);
  };

  const handleCreateNote = async ({ title, content, status, hashtagIds }) => {
    const color = setColor(status.code);

    await createNote({
      title,
      content,
      color,
      columnId: status.id,
      hashtagIds,
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

  const handleEditNote = async (note) => {
    const { id, content, title, hashtagIds } = note;
    await updateNoteById({
      id: id,
      body: {
        content,
        title,
        hashtagIds,
      },
    }).unwrap();

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
      onSuccess: () => { },
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
        {(isLoadingColumns ||
          isLoadingNotes ||
          isLoadingPut ||
          isLoadingPost ||
          isLoadingDelete ||
          isLoadingPutCard ||
          isFetchingColumns ||
          isFetchingNotes) && <Spinner />}
        <div className="w-full space-y-6">
          <div className="col-span-2 row-span-1 md:col-span-5">
            <NotesFilters
              onSearch={handleSearchChange}
              onSearchStatus={handleStatusChange}
              dataStatus={dataColumns?.data}
              filters={filters}
              handleReset={handleReset}
              setOpen={setOpen}
              selectedHashtagIds={selectedHashtagIds}
              onHashtagSelectionChange={handleHashtagSelectionChange}
              onCreateHashtag={handleCreateHashtag}
              onEditHashtag={handleEditHashtag}
              onDeleteHashtag={handleDeleteHashtag}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <NotesCreateDialog
              onCreateNote={handleCreateNote}
              dataStatus={dataColumns?.data}
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