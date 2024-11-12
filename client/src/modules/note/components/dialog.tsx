import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import PropTypes from 'prop-types'
import NoteForm from './form'

interface PropsNoteDialog{
  isDialogOpen:boolean;
  note: string;
  onOpenChange:()=> void;
  title: string;
}

const NoteDialog = ({ isDialogOpen, note, onOpenChange, title }:PropsNoteDialog) => {
  return (
    <Dialog onOpenChange={onOpenChange} open={isDialogOpen}>
      <DialogContent
        onInteractOutside={(e:React.KeyboardEvent<HTMLInputElement> ) => e.preventDefault()}
        className='max-w-2xl max-h-full overflow-y-scroll'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <NoteForm note={note} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  )
}

NoteDialog.propTypes = {
  onOpenChange: PropTypes.func,
  isDialogOpen: PropTypes.bool,
  title: PropTypes.string.isRequired,
  note: PropTypes.object
}

export default NoteDialog