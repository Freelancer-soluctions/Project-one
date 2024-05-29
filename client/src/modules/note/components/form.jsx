import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import validateResolver from "@/lib/avjInstance";
import { cn } from "@/lib/utils";
import objectToFormData from "@/utils/objectToFormData";
import { format } from 'date-fns';
import PropTypes from "prop-types";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useCreateNoteMutation from "../hooks/useCreateNoteMutation";
import defaultValues from "../utils/defaultValues";
import NoteSchema from "../utils/schema";
import useUpdateNoteMutation from "../hooks/useUpdateMutation";


const NoteForm = ({ note, onOpenChange }) => {
    const useCreateMutation = useCreateNoteMutation(onOpenChange);
    const useUpdateMutation = useUpdateNoteMutation(onOpenChange);
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
    const onSubmit = (values) => {
        const formValues = objectToFormData(values)
        if (!note) {
            useCreateMutation.mutate(formValues);
        } else {
            useUpdateMutation.mutate({formValues, id:note.id})
        }

    }
    const form = useForm({

        resolver: async (data) => {

            return validateResolver(NoteSchema, data)

        },
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
                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem className="col-span-12">
                                    <FormLabel>Note</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Note description"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="document"
                            render={({ field }) => (
                                <FormItem className="col-span-12  lg:col-span-6">
                                    <FormLabel>Document</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept=".jpg, .jpeg, .png, .svg"
                                            onChange={(event) => {
                                                field.onChange(event.target.files ? event.target.files[0] : null)

                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="statusId"
                            render={({ field }) => (

                                <FormItem className="col-span-12  lg:col-span-6">
                                    <FormLabel>Status </FormLabel>
                                    <Select
                                        value={field.value.toString()}
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        defaultValue={field.value.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a status to display" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {
                                                statusItems.map((status) => (
                                                    <SelectItem key={status.id}
                                                        value={status.id.toString()}
                                                    >
                                                        {status.description}
                                                    </SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="createdBy"
                            render={({ field }) => (
                                <FormItem className="col-span-12  lg:col-span-6">
                                    <FormLabel>Created By</FormLabel>
                                    <Select
                                        value={field.value.toString()}
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        defaultValue={field.value.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a item to display" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {
                                                createdByItems.map((item) => (
                                                    <SelectItem key={item.id}
                                                        value={item.id.toString()}
                                                    >
                                                        {item.name}
                                                    </SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="closedBy"
                            render={({ field }) => (
                                <FormItem className="col-span-12  lg:col-span-6">
                                    <FormLabel>Closed By</FormLabel>
                                    <Select
                                        value={field.value.toString()}
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        defaultValue={field.value.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a item to display" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {
                                                createdByItems.map((item) => (
                                                    <SelectItem key={item.id}
                                                        value={item.id.toString()}
                                                    >
                                                        {item.name}
                                                    </SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="createdOn"
                            render={({ field }) => (
                                <FormItem className="flex flex-col col-span-12  lg:col-span-6">
                                    <FormLabel>Created On</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "yyyy-MM-dd")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}

                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="closedOn"
                            render={({ field }) => (
                                <FormItem className="flex flex-col col-span-12  lg:col-span-6">
                                    <FormLabel>Closed On</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "yyyy-MM-dd")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}

                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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