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

export default AlertDialogComponent;
