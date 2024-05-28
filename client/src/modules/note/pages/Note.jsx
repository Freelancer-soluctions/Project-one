import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import DataTable from "../../../components/dataTable/dataTable";
import NoteDialog from "../components/dialog";
import gridColumns from "../components/gridColumns";
import useGetNotes from "../hooks/useGetNotes";

const Note = () => {

  const { data: notes, isFetching } = useGetNotes();
  const onDelete = useCallback(
    () => console.log('On delete, ;ho'),
    []
  )

  const onEdit = useCallback(
    () => console.log('On edit'),
    []
  )

  const [showModal, setShowModal] = useState(false)
  return (
    <section className="py-16">
      <div className="container">
        <h1 className="text-3xl font-bold">Notes</h1>
        <Button onClick={() => setShowModal(true)}> Create Note </Button>
        <NoteDialog
          showModal={showModal}
          setShowModal={setShowModal}
          title="Create Note"
        />
        {!isFetching && <DataTable columns={gridColumns({ onDelete, onEdit })} data={notes.data} />}

      </div>

    </section>
  )

}

export default Note;