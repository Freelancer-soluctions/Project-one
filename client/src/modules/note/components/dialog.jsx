import PropTypes from "prop-types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import NoteForm from "./form";

const NoteDialog = ({

    setShowModal,
    showModal,
    title,

}) => {

    return (
        <Dialog
            onOpenChange={ setShowModal }
            open={ showModal }
        >
            <DialogContent
                className="max-w-2xl max-h-full overflow-y-scroll">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <NoteForm />
            </DialogContent>
        </Dialog>
    )
}

NoteDialog.propTypes = {

    setShowModal: PropTypes.func,
    showModal: PropTypes.bool,
    title: PropTypes.string.isRequired,

  };

export default NoteDialog