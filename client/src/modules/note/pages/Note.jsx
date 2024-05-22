import { Button } from "@/components/ui/button";
import { useState } from "react";
import DataTable from "../../../components/dataTable/dataTable";
import NoteDialog from "../components/dialog";
import gridColumns from "../components/gridColumns";

const Note = () => {
  const data =  [
    {
      "id": 1,
      "closedOn": "2024-09-09T00:00:00.000Z",
      "createdOn": "2020-04-04T00:00:00.000Z",
      "document": "https://res.cloudinary.com/dc4kwuipu/image/upload/v1716412649/poofrl6rvjcc7cjiksqr.png",
      "documentId": "poofrl6rvjcc7cjiksqr",
      "note": "Note description",
      "statusId": 1,
      "closedBy": 1,
      "createdBy": 1,
      "status": {
        "id": 1,
        "code": "CO1",
        "description": "Active"
      },
      "userNoteClosed": {
        "id": 1,
        "accessConfiguration": false,
        "accessNews": false,
        "address": "address",
        "birthday": "1995-04-22T16:15:38.959Z",
        "city": "city",
        "document": "photo",
        "documentId": "123",
        "email": "example@gmail.com",
        "isAdmin": false,
        "isManager": false,
        "lastUpdatedBy": "2024-04-22T16:13:56.128Z",
        "lastUpdatedOn": "2024-04-22T16:13:37.737Z",
        "name": "test",
        "roleId": 1,
        "socialSecurity": "123",
        "startDate": "2024-04-22T16:13:31.440Z",
        "state": "state",
        "statusId": 1,
        "telephone": "123",
        "zipcode": "123"
      },
      "userNoteCreated": {
        "id": 1,
        "accessConfiguration": false,
        "accessNews": false,
        "address": "address",
        "birthday": "1995-04-22T16:15:38.959Z",
        "city": "city",
        "document": "photo",
        "documentId": "123",
        "email": "example@gmail.com",
        "isAdmin": false,
        "isManager": false,
        "lastUpdatedBy": "2024-04-22T16:13:56.128Z",
        "lastUpdatedOn": "2024-04-22T16:13:37.737Z",
        "name": "test",
        "roleId": 1,
        "socialSecurity": "123",
        "startDate": "2024-04-22T16:13:31.440Z",
        "state": "state",
        "statusId": 1,
        "telephone": "123",
        "zipcode": "123"
      }
    }
  ]
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

        <DataTable columns={gridColumns}  data={data}/>
      </div>

    </section>
  )

}

export default Note;