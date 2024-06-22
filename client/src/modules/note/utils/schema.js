const NoteSchema = {
    type: 'object',
    consumes: ['multipart/form-data'],
    properties: {
        note: {
            type: 'string',
            minLength: 3,
            maxLength: 2000,
        },
        statusId: {
            type: 'integer',
        },
        createdBy: {
            type: 'integer',
        },
        closedBy: {
            type: 'integer',
        },
        document: {
            type: 'object'
        },
        createdOn: {
            type: 'object',
            format: 'date'
        },
        closedOn: {
            type: 'object',
            format: 'date'
        },
    },
    required: [
        'note',
        'statusId',
        'createdBy',
        'closedBy',
        'createdOn',
        'closedOn'],
    additionalProperties: false

}

export default NoteSchema