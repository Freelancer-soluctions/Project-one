import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import objectToFormData from "@/utils/objectToFormData";
import { zodResolver } from "@hookform/resolvers/zod";
import PropTypes from "prop-types";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import FormFactory from "../../../components/forms/formFactory";
import useCreateNoteMutation from "../hooks/useCreateNoteMutation";
import useUpdateNoteMutation from "../hooks/useUpdateMutation";
import defaultValues from "../utils/defaultValues";
import NoteFormDefinition from "../utils/formDefinition";
import NoteSchema from "../utils/schema";
const statusItems = [

    {
        id: 1,
        description: 'Status 1'
    },
    {
        id: 2,
        description: 'Status 2'
    },
    {
        id: 3,
        description: 'Status 3'
    }
]

const createdByItems = [

    {
        id: 1,
        name: 'name 1'
    },
    {
        id: 2,
        name: 'name 2'
    },
    {
        id: 3,
        name: 'name 3'
    }

]

const NoteForm = ({ note, onOpenChange }) => {
    const formDefinition = NoteFormDefinition({ statusItems, createdByItems });
    const useCreateMutation = useCreateNoteMutation(onOpenChange);
    const useUpdateMutation = useUpdateNoteMutation(onOpenChange);
    const onSubmit = (values) => {
        const formValues = objectToFormData(values)
        if (!note) {
            useCreateMutation.mutate(formValues);
        } else {
            useUpdateMutation.mutate({ formValues, id: note.id })
        }

    }
    const form = useForm({
        resolver: zodResolver(NoteSchema),
        defaultValues,
    })

    useEffect(() => {
        if (note) {
            const {
                closedOn,
                createdOn,
                closedBy,
                createdBy,
                document,
                statusId,
                note: description,
            } = note
            form.setValue('closedOn', new Date(closedOn));
            form.setValue('createdOn', new Date(createdOn));
            form.setValue('closedBy', closedBy);
            form.setValue('createdBy', createdBy);
            form.setValue('statusId', statusId);
            form.setValue('note', description);
            if (document) {
                const file = new File(["document"], document);
                form.setValue('document', file);
            }



        } else {
            form.reset();
        }
    }, [note, form]);

    return (
        <>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
                    <div className="grid grid-cols-12 gap-4">
                        {formDefinition.map((field) => (
                            <FormFactory key={field.name} fieldProps={field} control={form.control} />
                        ))}

                    </div>

                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </>
    )

}

NoteForm.propTypes = {

    note: PropTypes.object,
    onOpenChange: PropTypes.func

};

export default NoteForm;