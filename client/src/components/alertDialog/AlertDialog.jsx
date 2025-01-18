import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

const AlertDialogComponent = ({
  openAlertDialog,
  setOpenAlertDialog,
  alertProps
}) => {
  return (
    <AlertDialog
      open={openAlertDialog}
      onOpenChange={isOpen => {
        if (isOpen === true) return
        setOpenAlertDialog(false)
      }}>
      {/* <AlertDialogTrigger>Open</AlertDialogTrigger> */}
      <AlertDialogContent onEscapeKeyDown={event => event.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{alertProps.alertTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {alertProps.alertMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {alertProps.cancel && <AlertDialogCancel>Cancel</AlertDialogCancel>}
          {alertProps.success && (
            <AlertDialogAction
              variant={alertProps.variantSuccess}
              onClick={() => {
                alertProps.onSuccess()
              }}>
              Ok
            </AlertDialogAction>
          )}
          {alertProps.destructive && (
            <AlertDialogAction
              variant={alertProps.variantDestructive}
              onClick={() => {
                alertProps.onDelete()
              }}>
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AlertDialogComponent
