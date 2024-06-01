import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import {
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
import PropTypes from "prop-types";

const FormFactory = ({ fieldProps, control }) => {

    const renderFieldComponent = {
        textArea: (field) => (
            < >
                <FormControl>
                    <Textarea
                        placeholder={fieldProps.placeholder}
                        className="resize-none"
                        {...field}
                    />
                </FormControl>
            </>

        ),
        inputFile: (field) => (
            <>
                <FormControl>
                    <Input
                        type="file"
                        accept={fieldProps.accept}
                        onChange={(event) => {
                            field.onChange(event.target.files ? event.target.files[0] : null)

                        }}
                    />
                </FormControl>
            </>
        ),
        selectIdValue: (field) => (
            <>
                <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value.toString()}
                >
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={fieldProps.placeholder} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {
                            fieldProps.items.map((item) => (
                                <SelectItem key={item.id}
                                    value={item.id.toString()}
                                >
                                    {item[fieldProps.descriptionField]}
                                </SelectItem>
                            ))
                        }
                    </SelectContent>
                </Select>
            </>
        ),
        date: (field) => (
            <>
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
                                    <span>{fieldProps.placeholder}</span>
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
            </>
        )
    }

    return (
        <>
            <FormField
                control={control}
                name={fieldProps.name}
                render={({ field }) => (
                    <FormItem className={ fieldProps.itemClassName}>
                        <FormLabel>{fieldProps.label}</FormLabel>
                        {renderFieldComponent[fieldProps.componentType](field)}
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    )
}

FormFactory.propTypes = {

    fieldProps: PropTypes.object,
    control: PropTypes.object

};
export default FormFactory