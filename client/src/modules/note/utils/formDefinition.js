const NoteFormDefinition = ({statusItems, createdByItems})=> {
    
    return [
    {
        name: "note", label: "Note",
        componentType: "textArea",
        itemClassName: "col-span-12",
        placeholder: "Note description"
    },
    {
        name: "document", label: "Document",
        componentType: "inputFile",
        itemClassName: "col-span-12  lg:col-span-6",
        placeholder: "Document",
        accept: ".jpg, .jpeg, .png, .webp"
    },
    {
        name: "statusId", label: "Status",
        componentType: "selectIdValue",
        itemClassName: "col-span-12  lg:col-span-6",
        placeholder: "Select a status to display",
        items: statusItems,
        descriptionField: "description"
    },
    {
        name: "createdBy", label: "Created By",
        componentType: "selectIdValue",
        itemClassName: "col-span-12  lg:col-span-6",
        placeholder: "Select a item to display",
        items: createdByItems,
        descriptionField: "name"

    },
    {
        name: "closedBy", label: "Closed By",
        componentType: "selectIdValue",
        itemClassName: "col-span-12  lg:col-span-6",
        placeholder: "Select a item to display",
        items: createdByItems,
        descriptionField: "name"
    },

    {
        name: "createdOn", label: "Created On",
        componentType: "date",
        itemClassName: "flex flex-col col-span-12  lg:col-span-6",
        placeholder: "Pick a date",
    },
    {
        name: "closedOn", label: "Closed On",
        componentType: "date",
        itemClassName: "flex flex-col col-span-12  lg:col-span-6",
        placeholder: "Pick a date",
    },
];
}

export default NoteFormDefinition;