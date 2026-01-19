import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const AlertDialogComponent = ({
  openAlertDialog,
  setOpenAlertDialog,
  alertProps,
}) => {
  const { t } = useTranslation();
  return (
    <AlertDialog
      open={openAlertDialog}
      onOpenChange={(isOpen) => {
        if (isOpen === true) return;
        setOpenAlertDialog(false);
      }}
    >
      {/* <AlertDialogTrigger>Open</AlertDialogTrigger> */}
      <AlertDialogContent onEscapeKeyDown={(event) => event.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{alertProps.alertTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {alertProps.alertMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {alertProps.cancel && (
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          )}
          {alertProps.success && (
            <AlertDialogAction
              variant={alertProps.variantSuccess}
              onClick={() => {
                alertProps.onSuccess();
              }}
            >
              {t('ok')}
            </AlertDialogAction>
          )}
          {alertProps.destructive && (
            <AlertDialogAction
              variant={alertProps.variantDestructive}
              onClick={() => {
                alertProps.onDelete();
              }}
            >
              {t('delete')}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

AlertDialogComponent.propTypes = {
  openAlertDialog: PropTypes.bool.isRequired,
  setOpenAlertDialog: PropTypes.func.isRequired,
  alertProps: PropTypes.shape({
    alertTitle: PropTypes.string,
    alertMessage: PropTypes.string,
    cancel: PropTypes.bool,
    success: PropTypes.bool,
    destructive: PropTypes.bool,
    variantSuccess: PropTypes.string,
    variantDestructive: PropTypes.string,
    onSuccess: PropTypes.func,
    onDelete: PropTypes.func,
  }).isRequired,
};

export default AlertDialogComponent;
