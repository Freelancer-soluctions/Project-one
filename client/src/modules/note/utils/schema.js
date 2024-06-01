import { z } from "zod";
// const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"]

const NoteSchema = z.object({
    note: z.string().min(3).max(2000),
    statusId: z.number().int().positive(),
    createdBy: z.number().int().positive(),
    closedBy: z.number().int().positive(),
    document: z.any()
        // .refine((file) => file && file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
        .refine(
            (file) => file && ACCEPTED_IMAGE_TYPES.includes(file?.type),
            "Only .jpg, .jpeg, .png and .webp formats are supported."
        ),
    createdOn: z.date(),
    closedOn: z.date(),

})

export default NoteSchema