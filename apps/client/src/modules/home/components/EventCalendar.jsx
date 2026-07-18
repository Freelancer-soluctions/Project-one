import * as React from "react"
import PropTypes from "prop-types"
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns"
import { es } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Video,
  Globe,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

// Mapeo de tipo de evento -> color del bullet
function getEventColor(description) {
  switch ((description || "").toUpperCase()) {
    case "CONFERENCE":
      return "bg-emerald-500"
    case "WORKSHOP":
      return "bg-blue-500"
    case "SESSION":
      return "bg-purple-500"
    default:
      return "bg-gray-500"
  }
}

// Icono de modalidad
function ModalityIcon({ modality, className }) {
  if (modality === "ONLINE") return <Video className={className} aria-hidden="true" />
  if (modality === "HYBRID") return <Globe className={className} aria-hidden="true" />
  return null
}

ModalityIcon.propTypes = {
  modality: PropTypes.string,
  className: PropTypes.string,
}

// Hook simple para detectar viewport mobile (<768px)
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)")
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

// Tooltip con detalle completo del evento
function EventTooltipContent({ event }) {
  return (
    <div className="space-y-1">
      <p className="font-semibold">{event.title}</p>
      <p className="text-xs">
        {event.startTime} - {event.endTime}
      </p>
      {event.speaker ? <p className="text-xs">Speaker: {event.speaker}</p> : null}
      {event.location ? <p className="text-xs">Ubicación: {event.location}</p> : null}
      {event.meetingUrl && (event.modality === "ONLINE" || event.modality === "HYBRID") ? (
        <p className="text-xs">Reunión en línea</p>
      ) : null}
    </div>
  )
}

EventTooltipContent.propTypes = {
  event: PropTypes.object.isRequired,
}

// Chip de evento dentro de una celda del grid
function EventChip({ event, compact, onClick }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.(event)
          }}
          className={cn(
            "flex w-full items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-xs transition-colors hover:bg-muted/50",
          )}
        >
          <span
            className={cn("size-2 shrink-0 rounded-full", getEventColor(event.eventTypeDescription))}
            aria-hidden="true"
          />
          {!compact ? (
            <span className="shrink-0 tabular-nums text-muted-foreground">{event.startTime}</span>
          ) : null}
          <span className="line-clamp-1 flex-1 font-medium">{event.title}</span>
          <ModalityIcon modality={event.modality} className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <EventTooltipContent event={event} />
      </TooltipContent>
    </Tooltip>
  )
}

EventChip.propTypes = {
  event: PropTypes.object.isRequired,
  compact: PropTypes.bool,
  onClick: PropTypes.func,
}

// Skeleton de carga: 5 filas x 7 columnas
function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-px">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={`head-${i}`} className="p-2">
          <Skeleton className="mx-auto h-4 w-8" />
        </div>
      ))}
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={`cell-${i}`} className="min-h-[100px] space-y-1 p-1.5">
          <Skeleton className="h-4 w-5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}

function EventCalendar({
  events,
  isLoading = false,
  onEventClick,
  onDateClick,
  onMonthChange,
  className,
}) {
  const [currentMonth, setCurrentMonth] = React.useState(() => startOfMonth(new Date()))
  const isMobile = useIsMobile()

  const goToMonth = React.useCallback(
    (month) => {
      const normalized = startOfMonth(month)
      setCurrentMonth(normalized)
      onMonthChange?.(normalized)
    },
    [onMonthChange],
  )

  const isCurrentMonth = isSameMonth(currentMonth, new Date())

  // Agrupa eventos por fecha "YYYY-MM-DD" y los ordena por hora de inicio
  const eventsByDate = React.useMemo(() => {
    const map = new Map()
    for (const event of events) {
      const list = map.get(event.eventDate) || []
      list.push(event)
      map.set(event.eventDate, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
    return map
  }, [events])

  const getEventsForDay = React.useCallback(
    (day) => eventsByDate.get(format(day, "yyyy-MM-dd")) || [],
    [eventsByDate],
  )

  // Días visibles del grid (semanas completas, lunes a domingo)
  const calendarDays = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Eventos del mes para la vista mobile, ordenados por fecha + hora
  const monthEvents = React.useMemo(() => {
    return events
      .filter((e) => isSameMonth(parseISO(e.eventDate), currentMonth))
      .sort((a, b) => {
        const dateCmp = a.eventDate.localeCompare(b.eventDate)
        return dateCmp !== 0 ? dateCmp : a.startTime.localeCompare(b.startTime)
      })
  }, [events, currentMonth])

  const monthLabel = format(currentMonth, "LLLL yyyy", { locale: es })
  const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const Header = (
    <div className="flex items-center justify-between gap-2 border-b p-3">
      <div className="flex items-center gap-2">
        <CalendarIcon className="size-5 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-base font-semibold capitalize">{capitalizedMonth}</h2>
      </div>
      <div className="flex items-center gap-1">
        {!isCurrentMonth ? (
          <Button variant="outline" size="sm" onClick={() => goToMonth(new Date())}>
            Hoy
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToMonth(subMonths(currentMonth, 1))}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToMonth(addMonths(currentMonth, 1))}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )

  // Vista mobile: lista vertical agrupada por día
  if (isMobile) {
    return (
      <TooltipProvider>
        <Card className={cn("flex h-full flex-col overflow-hidden", className)}>
          {Header}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="space-y-4 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : monthEvents.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y">
                {groupByDay(monthEvents).map(({ dateKey, dayEvents }) => (
                  <div key={dateKey} className="p-4">
                    <p className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
                      {format(parseISO(dateKey), "EEE d 'de' MMMM", { locale: es })}
                    </p>
                    <div className="space-y-3">
                      {dayEvents.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => onEventClick?.(event)}
                          className="flex w-full flex-col gap-1 rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "size-2.5 shrink-0 rounded-full",
                                getEventColor(event.eventTypeDescription),
                              )}
                              aria-hidden="true"
                            />
                            <span className="shrink-0 text-sm font-medium tabular-nums">
                              {event.startTime}
                            </span>
                            <span className="line-clamp-1 flex-1 text-sm font-medium">
                              {event.title}
                            </span>
                            <ModalityIcon
                              modality={event.modality}
                              className="size-4 shrink-0 text-muted-foreground"
                            />
                          </div>
                          {event.speaker ? (
                            <p className="pl-[18px] text-xs text-muted-foreground">
                              Speaker: {event.speaker}
                            </p>
                          ) : null}
                          {event.location ? (
                            <p className="flex items-center gap-1 pl-[18px] text-xs text-muted-foreground">
                              <MapPin className="size-3" /> {event.location}
                            </p>
                          ) : null}
                          {event.meetingUrl &&
                          (event.modality === "ONLINE" || event.modality === "HYBRID") ? (
                            <p className="flex items-center gap-1 pl-[18px] text-xs text-primary">
                              <Video className="size-3" /> Unirse a la reunión
                            </p>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </TooltipProvider>
    )
  }

  // Vista desktop/tablet: grid mensual
  return (
    <TooltipProvider>
      <Card className={cn("flex h-full flex-col overflow-hidden", className)}>
        {Header}
        {isLoading ? (
          <div className="flex-1 p-2">
            <CalendarSkeleton />
          </div>
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-1 flex-col">
            {/* Encabezados de día */}
            <div className="grid grid-cols-7 border-b">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-semibold text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Grid de días */}
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dayEvents = getEventsForDay(day)
                  const inMonth = isSameMonth(day, currentMonth)
                  const today = isToday(day)
                  const visible = dayEvents.slice(0, 2)
                  const remaining = dayEvents.length - visible.length

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => onDateClick?.(day)}
                      className={cn(
                        "min-h-[80px] cursor-pointer border-b border-r p-1.5 last:border-r-0 lg:min-h-[100px]",
                        !inMonth && "bg-muted/30",
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full text-xs",
                            !inMonth && "text-muted-foreground/50",
                            today && "bg-primary font-semibold text-primary-foreground",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {visible.map((event) => (
                          <EventChip
                            key={event.id}
                            event={event}
                            onClick={onEventClick}
                          />
                        ))}
                        {remaining > 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="w-full"
                              >
                                <Badge
                                  variant="outline"
                                  className="w-full justify-center text-[10px] font-normal"
                                >
                                  +{remaining} más
                                </Badge>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <div className="space-y-1">
                                {dayEvents.slice(2).map((event) => (
                                  <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => onEventClick?.(event)}
                                    className="flex w-full items-center gap-1.5 text-left text-xs"
                                  >
                                    <span
                                      className={cn(
                                        "size-2 shrink-0 rounded-full",
                                        getEventColor(event.eventTypeDescription),
                                      )}
                                    />
                                    <span className="tabular-nums">{event.startTime}</span>
                                    <span className="line-clamp-1">{event.title}</span>
                                  </button>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </Card>
    </TooltipProvider>
  )
}

// Estado vacío reutilizable
function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
      <CalendarIcon className="size-10 text-muted-foreground/50" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">No hay eventos para este mes</p>
    </div>
  )
}

// Agrupa una lista de eventos (ya ordenada) por su fecha
function groupByDay(sortedEvents) {
  const groups = []
  const indexByKey = new Map()
  for (const event of sortedEvents) {
    if (!indexByKey.has(event.eventDate)) {
      indexByKey.set(event.eventDate, groups.length)
      groups.push({ dateKey: event.eventDate, dayEvents: [] })
    }
    groups[indexByKey.get(event.eventDate)].dayEvents.push(event)
  }
  return groups
}

EventCalendar.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      eventDate: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      speaker: PropTypes.string,
      eventTypeCode: PropTypes.string,
      eventTypeDescription: PropTypes.string,
      modality: PropTypes.string,
      meetingUrl: PropTypes.string,
      location: PropTypes.string,
    }),
  ).isRequired,
  isLoading: PropTypes.bool,
  onEventClick: PropTypes.func,
  onDateClick: PropTypes.func,
  onMonthChange: PropTypes.func,
  className: PropTypes.string,
}

export default EventCalendar
export { EventCalendar }
