import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/loader/Spinner';
import {
  useRegisterForEventMutation,
  useCancelRegistrationMutation,
} from '../api/eventsAPI';
import AlertDialogComponent from '@/components/alertDialog/AlertDialog';

/**
 * AttendButton — shows Register/Cancel/Waitlisted based on current user's status.
 *
 * @param {Object} props
 * @param {number} props.eventId
 * @param {string|null} props.userStatus - User's current attendee status (CONFIRMED/WAITLIST/CANCELLED/null)
 * @param {function} props.onStatusChange - Callback after registration/cancellation
 */
export const AttendButton = ({ eventId, userStatus, onStatusChange }) => {
  const { t } = useTranslation();
  const [register, { isLoading: isRegistering }] =
    useRegisterForEventMutation();
  const [cancel, { isLoading: isCancelling }] = useCancelRegistrationMutation();
  const [alertProps, setAlertProps] = useState({});
  const [openAlert, setOpenAlert] = useState(false);

  const isLoading = isRegistering || isCancelling;

  const handleRegister = async () => {
    try {
      await register(eventId).unwrap();
      setAlertProps({
        alertTitle: t('register'),
        alertMessage: t('added_successfully'),
        cancel: false,
        success: true,
        variantSuccess: 'info',
      });
      setOpenAlert(true);
      onStatusChange?.();
    } catch (err) {
      setAlertProps({
        alertTitle: t('error'),
        alertMessage: err?.data?.message || t('something_went_wrong'),
        cancel: false,
        success: false,
        variantSuccess: 'destructive',
      });
      setOpenAlert(true);
    }
  };

  const handleCancel = async () => {
    try {
      await cancel(eventId).unwrap();
      setAlertProps({
        alertTitle: t('cancel'),
        alertMessage: t('deleted_successfully'),
        cancel: false,
        success: true,
        variantSuccess: 'info',
      });
      setOpenAlert(true);
      onStatusChange?.();
    } catch (err) {
      setAlertProps({
        alertTitle: t('error'),
        alertMessage: err?.data?.message || t('something_went_wrong'),
        cancel: false,
        success: false,
        variantSuccess: 'destructive',
      });
      setOpenAlert(true);
    }
  };

  if (isLoading) return <Spinner />;

  if (userStatus === 'CONFIRMED') {
    return (
      <>
        <Button
          variant="destructive"
          onClick={handleCancel}
          disabled={isLoading}
        >
          {t('cancel_registration')}
        </Button>
        <AlertDialogComponent
          openAlertDialog={openAlert}
          setOpenAlertDialog={setOpenAlert}
          alertProps={alertProps}
        />
      </>
    );
  }

  if (userStatus === 'WAITLIST') {
    return (
      <>
        <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
          {t('leave_waitlist')}
        </Button>
        <AlertDialogComponent
          openAlertDialog={openAlert}
          setOpenAlertDialog={setOpenAlert}
          alertProps={alertProps}
        />
      </>
    );
  }

  return (
    <>
      <Button onClick={handleRegister} disabled={isLoading}>
        {t('register')}
      </Button>
      <AlertDialogComponent
        openAlertDialog={openAlert}
        setOpenAlertDialog={setOpenAlert}
        alertProps={alertProps}
      />
    </>
  );
};

AttendButton.propTypes = {
  eventId: PropTypes.number.isRequired,
  userStatus: PropTypes.string,
  onStatusChange: PropTypes.func,
};
