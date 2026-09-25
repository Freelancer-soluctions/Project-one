import * as React from 'react';
import PropTypes from 'prop-types';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';

/**
 * Estilos de navegación y cabecera del calendario (nav, botones, dropdowns).
 *
 * @param {Object} p - Parámetros de estilo.
 * @param {Object} p.d - ClassNames por defecto de DayPicker.
 * @param {string} p.buttonVariant - Variante de botón para la navegación.
 * @returns {Object} ClassNames de la zona superior.
 */
const headerClassNames = ({ d, buttonVariant }) => ({
  root: cn('w-fit', d.root),
  months: cn('relative flex flex-col gap-4 md:flex-row', d.months),
  month: cn('flex w-full flex-col gap-4', d.month),
  nav: cn(
    'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
    d.nav
  ),
  button_previous: cn(
    buttonVariants({ variant: buttonVariant }),
    'h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50',
    d.button_previous
  ),
  button_next: cn(
    buttonVariants({ variant: buttonVariant }),
    'h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50',
    d.button_next
  ),
  month_caption: cn(
    'flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]',
    d.month_caption
  ),
  dropdowns: cn(
    'flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium',
    d.dropdowns
  ),
  dropdown_root: cn(
    'has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border',
    d.dropdown_root
  ),
  dropdown: cn('bg-popover absolute inset-0 opacity-0', d.dropdown),
  caption_label: cn('select-none font-medium', d.caption_label),
});

/**
 * Estilos de la cuadrícula de días (tabla, semanas, rangos, estados).
 *
 * @param {Object} p - Parámetros de estilo.
 * @param {Object} p.d - ClassNames por defecto de DayPicker.
 * @returns {Object} ClassNames de la cuadrícula.
 */
const gridClassNames = ({ d }) => ({
  table: 'w-full border-collapse',
  weekdays: cn('flex', d.weekdays),
  weekday: cn(
    'text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal',
    d.weekday
  ),
  week: cn('mt-2 flex w-full', d.week),
  week_number_header: cn('w-[--cell-size] select-none', d.week_number_header),
  week_number: cn(
    'text-muted-foreground select-none text-[0.8rem] font-normal',
    d.week_number
  ),
  day: cn(
    'group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md',
    d.day
  ),
  range_start: cn('bg-accent rounded-l-md', d.range_start),
  range_middle: cn('rounded-none', d.range_middle),
  range_end: cn('bg-accent rounded-r-md', d.range_end),
  today: cn(
    'bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none',
    d.today
  ),
  outside: cn(
    'text-muted-foreground aria-selected:text-muted-foreground',
    d.outside
  ),
  disabled: cn('text-muted-foreground opacity-50', d.disabled),
  hidden: cn('invisible', d.hidden),
});

/**
 * Construye los classNames por defecto de DayPicker para el tema shadcn.
 *
 * @param {Object} p - Parámetros de estilo.
 * @param {Object} p.defaultClassNames - ClassNames por defecto de DayPicker.
 * @param {string} p.buttonVariant - Variante de botón para la navegación.
 * @returns {Object} Mapa de classNames para DayPicker.
 */
const buildCalendarClassNames = ({ defaultClassNames, buttonVariant }) => ({
  ...headerClassNames({ d: defaultClassNames, buttonVariant }),
  ...gridClassNames({ d: defaultClassNames }),
});

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        ...buildCalendarClassNames({ defaultClassNames, buttonVariant }),
        ...classNames,
      }}
      components={{
        Root: CalendarRoot,
        Chevron: CalendarChevron,
        DayButton: CalendarDayButton,
        WeekNumber: CalendarWeekNumber,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarRoot({ className, rootRef, ...props }) {
  return (
    <div
      data-slot="calendar"
      ref={rootRef}
      className={cn(className)}
      {...props}
    />
  );
}
CalendarRoot.propTypes = {
  className: PropTypes.string,
  rootRef: PropTypes.any,
};

function CalendarChevron({ className, orientation, ...props }) {
  if (orientation === 'left') {
    return <ChevronLeftIcon className={cn('size-4', className)} {...props} />;
  }
  if (orientation === 'right') {
    return <ChevronRightIcon className={cn('size-4', className)} {...props} />;
  }
  return <ChevronDownIcon className={cn('size-4', className)} {...props} />;
}
CalendarChevron.propTypes = {
  className: PropTypes.string,
  orientation: PropTypes.string,
};

function CalendarWeekNumber({ children, ...props }) {
  return (
    <td {...props}>
      <div className="flex size-[--cell-size] items-center justify-center text-center">
        {children}
      </div>
    </td>
  );
}
CalendarWeekNumber.propTypes = {
  children: PropTypes.node,
};

function CalendarDayButton({ className, day, modifiers, ...props }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70',
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

Calendar.propTypes = {
  className: PropTypes.string,
  classNames: PropTypes.object,
  showOutsideDays: PropTypes.bool,
  captionLayout: PropTypes.string,
  buttonVariant: PropTypes.string,
  formatters: PropTypes.object,
  components: PropTypes.object,
};

CalendarDayButton.propTypes = {
  className: PropTypes.string,
  day: PropTypes.shape({
    date: PropTypes.instanceOf(Date),
  }),
  modifiers: PropTypes.shape({
    focused: PropTypes.bool,
    selected: PropTypes.bool,
    range_start: PropTypes.bool,
    range_end: PropTypes.bool,
    range_middle: PropTypes.bool,
  }),
};

export { Calendar, CalendarDayButton };
