import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pickDirty } from '@/utils/pickDirty';
import { LuCalendarDays, LuVideo, LuMapPin } from 'react-icons/lu';
import { format } from 'date-fns';

import { createEventsDialogSchema } from '../utils';
import { useTranslation } from 'react-i18next';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/**
 * Fila de form genérica: FormField de un campo de texto/input.
 *
 * @param {Object} p - Props de la fila.
 * @param {Object} p.form - Instancia de react-hook-form.
 * @param {string} p.name - Nombre del campo.
 * @param {string} p.label - Etiqueta (ya traducida).
 * @param {string} p.inputId - Id/for del input.
 * @param {string} [p.type='text'] - Tipo de input.
 * @param {string} [p.placeholder] - Placeholder.
 * @param {number} [p.maxLength] - Longitud máxima.
 * @param {boolean} [p.required=false] - Marca visual de obligatorio.
 * @returns {JSX.Element} Campo de formulario.
 */
const DialogTextField = ({
  form,
  name,
  label,
  inputId,
  type = 'text',
  placeholder,
  maxLength,
  required = false,
}) => (
  <div className="my-4">
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto col-span-1">
          <FormLabel htmlFor={inputId}>
            {label}
            {required && '*'}
          </FormLabel>
          <FormControl>
            <Input
              id={inputId}
              type={type}
              maxLength={maxLength}
              placeholder={placeholder}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

DialogTextField.propTypes = {
  form: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  inputId: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  maxLength: PropTypes.number,
  required: PropTypes.bool,
};

/**
 * Selector de modalidad del evento (ONLINE/IN_PERSON/HYBRID con iconos).
 *
 * @param {Object} p - Props del selector.
 * @param {Object} p.form - Instancia de react-hook-form.
 * @param {Function} p.t - Traductor.
 * @returns {JSX.Element} Campo de modalidad.
 */
const ModalitySelect = ({ form, t }) => (
  <div className="my-4">
    <FormField
      control={form.control}
      name="modality"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="modality">{t('modality')}*</FormLabel>
          <Select
            id="modality"
            onValueChange={(value) => {
              field.onChange(value);
            }}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_modality')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="ONLINE">
                <span className="flex items-center gap-2">
                  <LuVideo className="h-4 w-4" />
                  Online
                </span>
              </SelectItem>
              <SelectItem value="IN_PERSON">
                <span className="flex items-center gap-2">
                  <LuMapPin className="h-4 w-4" />
                  Presencial
                </span>
              </SelectItem>
              <SelectItem value="HYBRID">
                <span className="flex items-center gap-2">
                  <LuVideo className="h-4 w-4" />
                  <LuMapPin className="h-4 w-4" />
                  Híbrido
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

ModalitySelect.propTypes = {
  form: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
};

/**
 * Selector del tipo de evento (opciones traídas del backend).
 *
 * @param {Object} p - Props del selector.
 * @param {Object} p.form - Instancia de react-hook-form.
 * @param {Function} p.t - Traductor.
 * @param {Array<Object>} p.dataTypes - Tipos de evento.
 * @returns {JSX.Element} Campo de tipo.
 */
const EventTypeSelect = ({ form, t, dataTypes }) => (
  <div className="my-4">
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="type">{t('type')}*</FormLabel>
          <Select
            id="type"
            onValueChange={(value) => {
              field.onChange(value);
            }}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t('select_type')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {dataTypes.map((item) => (
                <SelectItem value={item.id.toString()} key={item.id}>
                  {item.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

EventTypeSelect.propTypes = {
  form: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
  dataTypes: PropTypes.array.isRequired,
};

/**
 * Campos condicionales según modalidad: meetingUrl (ONLINE/HYBRID) y
 * location (IN_PERSON/HYBRID).
 *
 * @param {Object} p - Props del bloque.
 * @param {Object} p.form - Instancia de react-hook-form.
 * @param {Function} p.t - Traductor.
 * @param {string} p.watchedModality - Modalidad vigilada del form.
 * @returns {JSX.Element|null} Campos visibles según modalidad.
 */
const ModalityConditionalFields = ({ form, t, watchedModality }) => (
  <>
    {(watchedModality === 'ONLINE' || watchedModality === 'HYBRID') && (
      <div className="my-4">
        <FormField
          control={form.control}
          name="meetingUrl"
          render={({ field }) => {
            return (
              <FormItem className="flex flex-col flex-auto col-span-1">
                <FormLabel htmlFor="meetingUrl">{t('meeting_url')}*</FormLabel>
                <FormControl>
                  <Input
                    id="meetingUrl"
                    type="url"
                    placeholder="https://meet.example.com/..."
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    )}
    {(watchedModality === 'IN_PERSON' || watchedModality === 'HYBRID') && (
      <div className="my-4">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => {
            return (
              <FormItem className="flex flex-col flex-auto col-span-1">
                <FormLabel htmlFor="location">{t('location_field')}*</FormLabel>
                <FormControl>
                  <Input
                    id="location"
                    type="text"
                    placeholder={t('location_placeholder')}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    )}
  </>
);

ModalityConditionalFields.propTypes = {
  form: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
  watchedModality: PropTypes.string,
};

/**
 * Selector de fecha con popover + Calendar.
 *
 * @param {Object} p - Props del campo.
 * @param {Object} p.form - Instancia de react-hook-form.
 * @param {Function} p.t - Traductor.
 * @param {boolean} p.isPopoverOpen - Apertura del popover.
 * @param {Function} p.setIsPopoverOpen - Setter de apertura del popover.
 * @returns {JSX.Element} Campo de fecha.
 */
const EventDateField = ({ form, t, isPopoverOpen, setIsPopoverOpen }) => (
  <div className="my-4 ">
    <FormField
      control={form.control}
      name="eventDate"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto">
          <FormLabel htmlFor="eventDate">{t('date')}</FormLabel>
          <Popover
            modal={true}
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
          >
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  id="eventDate"
                  variant={'outline'}
                  className={cn(
                    'pl-3 text-left font-normal',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  {field.value ? (
                    format(field.value, 'PPP')
                  ) : (
                    <span>{t('pick_date')}</span>
                  )}
                  <LuCalendarDays className="w-4 h-4 ml-auto opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={(value) => {
                  field.onChange(value);
                }}
                disabled={(date) => date < new Date('1900-01-01')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

EventDateField.propTypes = {
  form: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
  isPopoverOpen: PropTypes.bool.isRequired,
  setIsPopoverOpen: PropTypes.func.isRequired,
};

/**
 * Campo de descripción (textarea) del formulario del diálogo.
 *
 * @param {Object} p - Props del campo.
 * @param {Object} p.form - Instancia de react-hook-form.
 * @param {Function} p.t - Traductor.
 * @returns {JSX.Element} Campo de descripción.
 */
const DescriptionField = ({ form, t }) => (
  <div className="my-4">
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem className="flex flex-col flex-auto col-span-1">
          <FormLabel htmlFor="description">{t('description')}*</FormLabel>
          <FormControl>
            <Textarea
              id="description"
              placeholder={t('description_placeholder')}
              className="resize-none"
              maxLength={FIELD_LIMITS.events.description}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

DescriptionField.propTypes = {
  form: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
};

/**
 * Pila de campos del formulario del diálogo (título, speaker, tipo,
 * modalidad, condicionales, fecha y horas).
 *
 * @param {Object} p - Props de la pila de campos.
 * @param {Object} p.form - Instancia de react-hook-form.
 * @param {Function} p.t - Traductor.
 * @param {Array<Object>} p.dataTypes - Tipos de evento.
 * @param {string} p.watchedModality - Modalidad vigilada del form.
 * @param {boolean} p.isPopoverOpen - Apertura del popover de fecha.
 * @param {Function} p.setIsPopoverOpen - Setter del popover de fecha.
 * @returns {JSX.Element} Campos del formulario.
 */
const EventDialogFields = ({
  form,
  t,
  dataTypes,
  watchedModality,
  isPopoverOpen,
  setIsPopoverOpen,
}) => (
  <>
    <DialogTextField
      form={form}
      name="title"
      label={t('title')}
      inputId="title"
      placeholder={t('title_placeholder')}
      maxLength={FIELD_LIMITS.events.title}
      required
    />

    <DialogTextField
      form={form}
      name="speaker"
      label={t('speaker')}
      inputId="speaker"
      placeholder={t('speaker_placeholder')}
      maxLength={FIELD_LIMITS.events.speaker}
      required
    />
    <EventTypeSelect form={form} t={t} dataTypes={dataTypes} />
    <ModalitySelect form={form} t={t} />
    <ModalityConditionalFields
      form={form}
      t={t}
      watchedModality={watchedModality}
    />
    <EventDateField
      form={form}
      t={t}
      isPopoverOpen={isPopoverOpen}
      setIsPopoverOpen={setIsPopoverOpen}
    />
    <DialogTextField
      form={form}
      name="startTime"
      label={t('start_time')}
      inputId="startTime"
      type="time"
      required
    />
    <DialogTextField
      form={form}
      name="endTime"
      label={t('end_time')}
      inputId="endTime"
      type="time"
      required
    />

    <DescriptionField form={form} t={t} />
  </>
);

EventDialogFields.propTypes = {
  form: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
  dataTypes: PropTypes.array.isRequired,
  watchedModality: PropTypes.string,
  isPopoverOpen: PropTypes.bool.isRequired,
  setIsPopoverOpen: PropTypes.func.isRequired,
};

/**
 * Resetea los campos condicionales al cambiar la modalidad:
 * ONLINE limpia location, IN_PERSON limpia meetingUrl, HYBRID no toca nada.
 *
 * @param {Object} p - Parámetros del reset.
 * @param {string} p.modality - Modalidad vigilada del form.
 * @param {Function} p.setValue - setValue de react-hook-form.
 */
const resetConditionalFields = ({ modality, setValue }) => {
  if (modality === 'ONLINE') {
    setValue('location', '');
  } else if (modality === 'IN_PERSON') {
    setValue('meetingUrl', '');
  } else if (modality === 'HYBRID') {
    // HYBRID needs both, don't reset
  } else {
    // modality cleared, reset both
    setValue('meetingUrl', '');
    setValue('location', '');
  }
};

/**
 * Mapea el evento recibido a los valores iniciales del formulario.
 *
 * @param {Object} event - Evento a editar (o null en creación).
 * @returns {Object} Valores listos para form.reset().
 */
const mapEventToFormValues = (event) => ({
  title: event.title || '',
  description: event.description || '',
  type: event.eventTypeId?.toString() || '',
  speaker: event.speaker || '',
  eventDate: event.eventDate ? new Date(event.eventDate) : '',
  startTime: event.startTime || '',
  endTime: event.endTime || '',
  modality: event.modality || '',
  meetingUrl: event.meetingUrl || '',
  location: event.location || '',
});

/**
 * Hook local: configuración completa del formulario del diálogo
 * (schema condicional, vigilancia de modalidad y resets derivados).
 *
 * @param {Object} event - Evento a editar (o null en creación).
 * @returns {{form: Object, watchedModality: string, onSubmitDialog: Function}} Form listo.
 */
function useEventDialogForm(event, onSubmit) {
  const schema = useMemo(
    () => createEventsDialogSchema(!!event?.id),
    [event?.id]
  );

  const form = useForm({
    resolver: zodResolver(schema),
  });
  const {
    formState: { dirtyFields },
    setValue,
  } = form;
  const watchedModality = useWatch({
    control: form.control,
    name: 'modality',
  });

  // Reset meetingUrl/location when modality changes
  useEffect(() => {
    resetConditionalFields({ modality: watchedModality, setValue });
  }, [watchedModality, setValue]);

  // Actualiza todos los valores del formulario al cambiar `event`
  useEffect(() => {
    if (event?.id) {
      form.reset(mapEventToFormValues(event));
    }
  }, [event, form]);

  const onSubmitDialog = (data) => {
    // keep same data transformations
    if (event.id) {
      const changes = pickDirty(data, dirtyFields);
      onSubmit({ id: event.id, body: changes });
    } else {
      onSubmit(data);
    }
  };

  return { form, watchedModality, onSubmitDialog };
}

export function EventDialog({
  open,
  onOpenChange,
  onSubmit,
  event,
  dataTypes,
}) {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); // date picker popover

  const {
    form: formEventDialog,
    watchedModality,
    onSubmitDialog,
  } = useEventDialogForm(event, onSubmit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {event.id ? 'Editar Evento' : 'Nuevo Evento'}
          </DialogTitle>
        </DialogHeader>
        <Form {...formEventDialog}>
          <form
            method="post"
            action=""
            id="events-form"
            noValidate
            onSubmit={formEventDialog.handleSubmit(onSubmitDialog)}
          >
            <EventDialogFields
              form={formEventDialog}
              t={t}
              dataTypes={dataTypes}
              watchedModality={watchedModality}
              isPopoverOpen={isPopoverOpen}
              setIsPopoverOpen={setIsPopoverOpen}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t('close')}
                </Button>
              </DialogClose>
              <Button type="submit" variant="info">
                {event.id ? t('save_changes') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

EventDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  event: PropTypes.object,
  dataTypes: PropTypes.array.isRequired,
};
