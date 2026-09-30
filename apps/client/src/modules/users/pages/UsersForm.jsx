import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import {
  useUpdateUserByIdMutation,
  useDeleteUserByIdMutation,
  useGetAllUsersStatusQuery,
  useGetAllUsersRolQuery,
  useGetAllUserPermitsQuery,
} from '../api/usersApi';
import { Spinner } from '@/components/loader/Spinner';
import { UsersBasicInfo } from '../components';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';
import { useNavigate, useLocation } from 'react-router';
import { useState, useMemo } from 'react';

/** Success alert props for the update flow (navigates back on OK). */
const buildUpdatedAlertProps = ({ t, navigate }) => ({
  alertTitle: t('update_record'),
  alertMessage: t('updated_successfully'),
  cancel: false,
  success: true,
  onSuccess: () => {
    navigate('/home/users');
  },
  variantSuccess: 'info',
});

/** Success alert props after a record is deleted. */
const buildDeletedAlertProps = ({ t }) => ({
  alertTitle: '',
  alertMessage: t('deleted_successfully'),
  cancel: false,
  success: true,
  onSuccess: () => {},
  variantSuccess: 'info',
});

/** Delete-confirmation handler for a user record. */
const makeDeleteHandler =
  ({ t, deleteUserById, setAlertProps, setOpenAlertDialog }) =>
  async (id) => {
    try {
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
            await deleteUserById(id).unwrap();

            setAlertProps(buildDeletedAlertProps({ t }));
            setOpenAlertDialog(true);
          } catch (err) {
            console.error('Error deleting:', err);
          }
        },
      });
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

/** Save handler: PATCH the dirty fields of the target user. */
const makeSaveHandler =
  ({
    t,
    updateUserById,
    selectedRow,
    setAlertProps,
    setOpenAlertDialog,
    navigate,
  }) =>
  async (values) => {
    try {
      // selectedRow contiene el id del usuario a editar (no viene en values porque
      // UsersBasicInfo envía solo campos dirty via pickDirty, sin incluir el id)
      const targetUserId = selectedRow?.id;
      if (!targetUserId) {
        console.error('No target user ID available');
        return;
      }

      // PATCH parcial: solo enviamos los campos que llegaron (valores dirty)
      const { roles, status, selectedPermissions, ...basicFields } = values;

      // Limpiar undefineds para no mandar { email: undefined } al server
      const cleanFields = Object.fromEntries(
        Object.entries(basicFields).filter(([, v]) => v !== undefined)
      );

      await updateUserById({
        id: targetUserId,
        data: {
          ...cleanFields,
          ...(roles?.id && { roleId: roles.id }),
          ...(status?.id && { statusId: status.id }),
          ...(selectedPermissions && { permissions: selectedPermissions }),
        },
      }).unwrap();

      setAlertProps(buildUpdatedAlertProps({ t, navigate }));
      setOpenAlertDialog(true);
    } catch (err) {
      console.error('Error:', err);
    }
  };

/**
 * Page state: catalogs, mutations and alert state for the user edit
 * form. The selected row comes from the router location state.
 */
function useUsersFormPageState() {
  const navigate = useNavigate();
  const [openAlertDialog, setOpenAlertDialog] = useState(false); //alert dialog open/close
  const [alertProps, setAlertProps] = useState({});
  const location = useLocation();

  const selectedRow = useMemo(() => {
    return location.state?.row ?? null;
  }, [location.state?.row]);

  const [updateUserById, { isLoading: isLoadingPut }] =
    useUpdateUserByIdMutation();

  const {
    data: dataUsersStatus = { data: [] },
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
  } = useGetAllUsersStatusQuery();

  const { data: dataUserPermits = { data: [] } } = useGetAllUserPermitsQuery();

  const [deleteUserById, { isLoading: isLoadingDelete }] =
    useDeleteUserByIdMutation();

  const {
    data: dataUsersRol = { data: [] },
    isLoading: isLoadingRol,
    isFetching: isFetchingRol,
  } = useGetAllUsersRolQuery();

  const isLoadingPage =
    isLoadingPut ||
    isLoadingDelete ||
    isLoadingStatus ||
    isLoadingRol ||
    isFetchingRol ||
    isFetchingStatus;

  return {
    navigate,
    selectedRow,
    openAlertDialog,
    setOpenAlertDialog,
    alertProps,
    setAlertProps,
    dataUsersStatus,
    dataUserPermits,
    dataUsersRol,
    isLoadingPage,
    updateUserById,
    deleteUserById,
  };
}

/** Static page layout for the user edit form. */
const buildUsersFormLayout = ({ t, page, saveHandler, deleteHandler }) => (
  <>
    <BackDashBoard link={'/home/users'} moduleName={t('edit_users')} />
    <div className="relative">
      {page.isLoadingPage && <Spinner />}

      <div className="container flex flex-col min-h-screen">
        <main className="container flex-1 py-6">
          <Tabs defaultValue="info" className="mb-6">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="info">{t('basic_information')}</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <UsersBasicInfo
                onSubmit={saveHandler}
                onDelete={deleteHandler}
                dataStatus={page.dataUsersStatus?.data}
                dataPermits={page.dataUserPermits?.data}
                dataRol={page.dataUsersRol?.data}
                selectedRow={page.selectedRow}
              />
            </TabsContent>
          </Tabs>
          <AlertDialogComponent
            openAlertDialog={page.openAlertDialog}
            setOpenAlertDialog={page.setOpenAlertDialog}
            alertProps={page.alertProps}
          />
        </main>
      </div>
    </div>
  </>
);

function UsersForms() {
  const { t } = useTranslation();
  const page = useUsersFormPageState();

  const saveHandler = makeSaveHandler({
    t,
    updateUserById: page.updateUserById,
    selectedRow: page.selectedRow,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
    navigate: page.navigate,
  });
  const deleteHandler = makeDeleteHandler({
    t,
    deleteUserById: page.deleteUserById,
    setAlertProps: page.setAlertProps,
    setOpenAlertDialog: page.setOpenAlertDialog,
  });

  return buildUsersFormLayout({ t, page, saveHandler, deleteHandler });
}
export default UsersForms;
