# Design System — Project One

> **Versión:** 1.0.0
> **Última actualización:** Junio 2026
> **Stack:** React 18 + Vite + Tailwind CSS 3 + shadcn/ui (new-york) + Radix UI + Storybook 8

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Design Tokens](#2-design-tokens)
3. [Componentes UI (Primitives)](#3-componentes-ui-primitives)
4. [Componentes Compuestos](#4-componentes-compuestos)
5. [Layout y Routing](#5-layout-y-routing)
6. [Patrones de Uso](#6-patrones-de-uso)
7. [Iconografía](#7-iconografía)
8. [Testing y Calidad](#8-testing-y-calidad)
9. [Theming y Personalización](#9-theming-y-personalización)
10. [Storybook](#10-storybook)
11. [Contribución y Mantenimiento](#11-contribución-y-mantenimiento)

---

## 1. Introducción

### 1.1 Propósito

Este documento define el sistema de diseño de **Project One**. Sirve como fuente única de verdad para:

- **Desarrolladores** — implementing UI components and pages
- **Diseñadores** — understanding constraints and capabilities
- **Reviewers** — ensuring consistency across the codebase
- **Nuevos integrantes** — onboarding al stack visual

### 1.2 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 18.3.1 |
| Build | Vite 6.4.1 |
| CSS | Tailwind CSS 3.4.6 + PostCSS |
| UI Library | shadcn/ui (new-york style) sobre Radix UI |
| Estado | Redux Toolkit 2.2.6 + RTK Query |
| Formularios | react-hook-form 7.52.1 + Zod 3.23.8 |
| Routing | React Router 7.1.1 |
| Testing | Vitest 4.0.18 + Testing Library + MSW 2.12.13 |
| Storybook | Storybook 8.5.6 con autodocs |
| i18n | react-i18next + i18next 24.2.1 |
| Iconos | Lucide React + Radix Icons + React Icons |

### 1.3 Estructura del Proyecto

```
src/
├── components/
│   ├── ui/           # Primitivas shadcn/ui (31 componentes)
│   ├── dataTable/    # DataTable compuesto con TanStack Table
│   ├── layout/       # Header, Main, Footer
│   ├── guards/       # ProtectedRoutes, ProtectedFormRoute
│   ├── tiptap/       # Editor rich text
│   ├── loader/       # Spinners y loading states
│   └── ...           # Componentes de negocio
├── hooks/            # Custom hooks (useFetch, useSocket, etc.)
├── lib/              # Utilidades (cn, etc.)
├── config/           # Axios, i18n, fieldLimits
├── redux/            # Store, slices, API slices
├── modules/          # 25 módulos de negocio
├── stories/          # Storybook stories
└── services/         # Servicios compartidos
```

### 1.4 Convenciones Generales

| Regla | Estándar |
|-------|----------|
| Naming componentes | PascalCase (`Button.jsx`, `DataTable.jsx`) |
| Naming archivos | kebab-case para dirs, PascalCase para componentes |
| Imports | Alias `@/` apunta a `src/` |
| Props | PropTypes obligatorio para componentes reutilizables |
| Ref forwarding | `React.forwardRef` + `displayName` en todos los UI components |
| Class merging | `cn()` utility (clsx + tailwind-merge) |
| Composición | `asChild` via `@radix-ui/react-slot` para polymorphic components |

---

## 2. Design Tokens

### 2.1 Color

El sistema usa **HSL CSS variables** con un matiz base **Zinc (240°)**. Los valores se almacenan como números HSL separados para permitir manipulación en runtime.

#### Token Semánticos

| Token | Light (HSL) | Dark (HSL) | Uso |
|-------|-------------|------------|-----|
| `--background` | `0 0% 100%` | `240 10% 3.9%` | Fondo principal de páginas |
| `--foreground` | `240 10% 3.9%` | `0 0% 98%` | Texto principal |
| `--card` | `0 0% 100%` | `240 10% 3.9%` | Fondo de cards |
| `--card-foreground` | `240 10% 3.9%` | `0 0% 98%` | Texto en cards |
| `--popover` | `0 0% 100%` | `240 10% 3.9%` | Fondo de popovers/tooltips |
| `--popover-foreground` | `240 10% 3.9%` | `0 0% 98%` | Texto en popovers |
| `--primary` | `240 5.9% 10%` | `0 0% 98%` | Acción principal, botones primary |
| `--primary-foreground` | `0 0% 98%` | `240 5.9% 10%` | Texto sobre primary |
| `--secondary` | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Acción secundaria |
| `--secondary-foreground` | `240 5.9% 10%` | `0 0% 98%` | Texto sobre secondary |
| `--muted` | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Fondo atenuado |
| `--muted-foreground` | `240 3.8% 46.1%` | `240 5% 64.9%` | Texto atenuado |
| `--accent` | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Fondo de acento (hover, ghost) |
| `--accent-foreground` | `240 5.9% 10%` | `0 0% 98%` | Texto sobre acento |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | Acciones destructivas (eliminar) |
| `--destructive-foreground` | `0 0% 98%` | `0 0% 98%` | Texto sobre destructive |
| `--border` | `240 5.9% 90%` | `240 3.7% 15.9%` | Bordes de componentes |
| `--input` | `240 5.9% 90%` | `240 3.7% 15.9%` | Bordes de inputs |
| `--ring` | `240 10% 3.9%` | `240 4.9% 83.9%` | Focus ring |
| `--radius` | `0.5rem` | `0.5rem` | Border radius base |

#### Tokens de Estado (Custom Extensions)

| Token | Light (HSL) | Dark (HSL) | Uso |
|-------|-------------|------------|-----|
| `--success` | `145 71% 47%` | `159 53% 28%` | Operaciones exitosas |
| `--success-foreground` | `0 0% 98%` | `0 0% 98%` | Texto sobre success |
| `--info` | `217 90% 61%` | `188 100% 27%` | Información |
| `--info-foreground` | `0 0% 98%` | `0 0% 98%` | Texto sobre info |
| `--warning` | `37 82% 61%` | `37 82% 61%` | Advertencias |
| `--warning-foreground` | `0 0% 98%` | `0 0% 98%` | Texto sobre warning |

#### Chart Colors

| Token | Light (HSL) | Dark (HSL) |
|-------|-------------|------------|
| `--chart-1` | `12 76% 61%` | `220 70% 50%` |
| `--chart-2` | `173 58% 39%` | `160 60% 45%` |
| `--chart-3` | `197 37% 24%` | `30 80% 55%` |
| `--chart-4` | `43 74% 66%` | `280 65% 60%` |
| `--chart-5` | `27 87% 67%` | `340 75% 55%` |

### 2.2 Modo Claro / Oscuro

- **Estrategia:** `class` strategy — se aplica clase `.dark` al `<html>`
- **Activación:** Por preferencia del sistema (`prefers-color-scheme`) con toggle manual
- **Override:** CSS variables se redefinen dentro de `.dark { ... }`
- **Tailwind:** Usar `dark:` prefix para variantes condicionales

```css
:root {
  --background: 0 0% 100%;
  /* ... light tokens */
}

.dark {
  --background: 240 10% 3.9%;
  /* ... dark tokens */
}
```

### 2.3 Tipografía

| Escala | Tailwind Class | Size | Line-Height |
|--------|---------------|------|-------------|
| Extra small | `text-xs` | 0.75rem (12px) | 1rem |
| Small | `text-sm` | 0.875rem (14px) | 1.25rem |
| Base | `text-base` | 1rem (16px) | 1.5rem |
| Large | `text-lg` | 1.125rem (18px) | 1.75rem |
| XL | `text-xl` | 1.25rem (20px) | 1.75rem |
| 2XL | `text-2xl` | 1.5rem (24px) | 2rem |
| 3XL | `text-3xl` | 1.875rem (30px) | 2.25rem |
| 4XL | `text-4xl` | 2.25rem (36px) | 2.5rem |

**Font family:** Sistema nativo (sin Google Fonts). Definido por defecto de Tailwind.

**Font weight:**
- Normal: `font-normal` (400)
- Medium: `font-medium` (500)
- Semibold: `font-semibold` (600) — títulos de componentes
- Bold: `font-bold` (700)

### 2.4 Border Radius

| Nivel | Cálculo | Valor por defecto |
|-------|---------|-------------------|
| `sm` | `calc(var(--radius) - 4px)` | `0.25rem` (4px) |
| `md` | `calc(var(--radius) - 2px)` | `0.375rem` (6px) |
| `lg` | `var(--radius)` | `0.5rem` (8px) |
| `xl` | `rounded-xl` | `0.75rem` (12px) — usado en Cards |

### 2.5 Espaciado

Basado en la escala de Tailwind (base 4px):

| Token | Tailwind | Píxeles | Contexto |
|-------|----------|---------|----------|
| 1 | `p-1` / `gap-1` | 4px | Micro-espaciado |
| 2 | `p-2` / `gap-2` | 8px | Espaciado interno pequeño |
| 3 | `p-3` / `gap-3` | 12px | |
| 4 | `p-4` / `gap-4` | 16px | Espaciado interno default |
| 6 | `p-6` / `gap-6` | 24px | Card padding |
| 8 | `p-8` / `gap-8` | 32px | Secciones |
| 10 | `p-10` | 40px | |
| 12 | `p-12` | 48px | Secciones grandes |

### 2.6 Sombras

| Nivel | Tailwind | Uso |
|-------|----------|-----|
| sm | `shadow-sm` | Cards, botones |
| md | `shadow-md` | Dropdowns, popovers |
| lg | `shadow-lg` | Modales, dialogs |
| xl | `shadow-xl` | Toasts, notificaciones |

### 2.7 Animaciones

| Keyframe | Duración | Timing | Uso |
|----------|----------|--------|-----|
| `accordion-down` | 0.2s | ease-out | Abrir acordeón |
| `accordion-up` | 0.2s | ease-out | Cerrar acordeón |
| `transition-colors` | 150ms | — | Hover, focus en botones/inputs |
| Tailwind animate | configurable | — | Plugins via `tailwindcss-animate` |

### 2.8 Breakpoints

| Breakpoint | Min-Width | Target |
|------------|-----------|--------|
| `sm` | 640px | Móvil landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Desktop wide |
| `2xl` | 1400px | Container max-width |

**Container:** `max-width: 1400px`, centrado, con `padding: 2rem`.

---

## 3. Componentes UI (Primitives)

### 3.1 Button

> **Source:** `src/components/ui/button.jsx`
> **Story:** `src/stories/ui/Button.stories.jsx`

Componente base para acciones. Usa `class-variance-authority` (cva) para variants.

#### Variants

| Variant | Visual | Uso |
|---------|--------|-----|
| `default` | Fondo primary, texto primary-foreground | Acción principal del formulario |
| `secondary` | Fondo secondary | Acción secundaria |
| `destructive` | Fondo destructive | Eliminar, peligro |
| `outline` | Borde, sin fondo | Alternativa a secondary |
| `ghost` | Sin fondo ni borde | Toolbars, icon buttons |
| `link` | Solo texto subrayado | Navegación inline |
| `success` | Fondo success (custom) | Confirmación |
| `info` | Fondo info (custom) | Información |
| `warning` | Fondo warning (custom) | Advertencia |

#### Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 32px (h-8) | px-3 | text-xs |
| `default` | 36px (h-9) | px-4 py-2 | text-sm |
| `lg` | 40px (h-10) | px-8 | text-sm |
| `icon` | 36px (h-9 w-9) | — | — |

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `'default'` | Estilo visual del botón |
| `size` | string | `'default'` | Tamaño del botón |
| `asChild` | boolean | `false` | Render como elemento hijo (polymorphic) |
| `className` | string | — | Clases adicionales |

#### Estados

- **Normal:** Default styling según variant
- **Hover:** Opacidad reducida (`hover:bg-{variant}/90`) o cambio de bg
- **Focus:** Focus ring con `focus-visible:ring-ring`
- **Disabled:** Opacidad 50%, pointer-events-none
- **Loading:** Usar estado externo + slot para spinner

```jsx
// Ejemplos de uso
<Button>Guardar</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="outline" size="sm">Cancelar</Button>
<Button asChild><a href="/products">Ver productos</a></Button>
```

### 3.2 Input / Textarea

> **Source:** `src/components/ui/input.jsx`, `src/components/ui/textarea.jsx`
> **Story:** `src/stories/ui/Input.stories.jsx`, `src/stories/ui/Textarea.stories.jsx`

#### Estados

- **Normal:** Borde `--input`, fondo transparente
- **Focus:** Borde `--ring` + ring `ring-1 ring-ring`
- **Disabled:** Opacidad reducida, cursor not-allowed
- **Placeholder:** Color `--muted-foreground`
- **Error:** Gestionado por Form + Zod, no por variante del input

```jsx
<Input placeholder="Nombre del producto" />
<Input type="email" disabled />
<Textarea placeholder="Descripción" rows={4} />
```

### 3.3 Select

> **Source:** `src/components/ui/select.jsx`
> **Story:** `src/stories/ui/Select.stories.jsx`

Implementado con Radix UI Select. Incluye scroll area automático.

```jsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Opción 1</SelectItem>
    <SelectItem value="2">Opción 2</SelectItem>
  </SelectContent>
</Select>
```

### 3.4 Checkbox / RadioGroup / Switch / Toggle

> **Sources:**
> - `src/components/ui/checkbox.jsx`
> - `src/components/ui/radio-group.jsx`
> - `src/components/ui/switch.jsx`
> - `src/components/ui/toggle.jsx`

#### Checkbox
```jsx
<Checkbox id="terms" />
<label htmlFor="terms">Acepto términos</label>
```

#### RadioGroup
```jsx
<RadioGroup defaultValue="active">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="active" id="active" />
    <Label htmlFor="active">Activo</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="inactive" id="inactive" />
    <Label htmlFor="inactive">Inactivo</Label>
  </div>
</RadioGroup>
```

#### Switch
```jsx
<Switch id="notifications" />
<Label htmlFor="notifications">Notificaciones</Label>
```

#### Toggle
```jsx
<Toggle aria-label="Toggle bold">
  <BoldIcon className="h-4 w-4" />
</Toggle>
```

### 3.5 Card

> **Source:** `src/components/ui/card.jsx`
> **Story:** `src/stories/ui/Card.stories.jsx`

Compuesto de 6 subcomponentes:

| Componente | Rol |
|------------|-----|
| `<Card>` | Contenedor con borde, sombra, bg-card |
| `<CardHeader>` | Header con padding p-6 |
| `<CardTitle>` | Título semibold, tracking-tight |
| `<CardDescription>` | Descripción muted, text-sm |
| `<CardContent>` | Contenido p-6 pt-0 |
| `<CardFooter>` | Footer con flex, p-6 pt-0 |

```jsx
<Card>
  <CardHeader>
    <CardTitle>Detalle del Producto</CardTitle>
    <CardDescription>SKU-12345</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Contenido aquí</p>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">Cancelar</Button>
    <Button>Guardar</Button>
  </CardFooter>
</Card>
```

### 3.6 Dialog / AlertDialog

> **Sources:**
> - `src/components/ui/dialog.jsx`
> - `src/components/ui/alert-dialog.jsx`
> - `src/stories/ui/Dialog.stories.jsx`
> - `src/stories/ui/AlertDialog.stories.jsx`

#### Dialog (Modal genérico)
```jsx
<Dialog>
  <DialogTrigger>Editar</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar Producto</DialogTitle>
      <DialogDescription>Modifica los campos</DialogDescription>
    </DialogHeader>
    {/* Form content */}
    <DialogFooter>
      <Button type="submit">Guardar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### AlertDialog (Confirmación destructiva)
```jsx
<AlertDialog>
  <AlertDialogTrigger>Eliminar</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
      <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction>Eliminar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 3.7 Popover / Tooltip

> **Sources:**
> - `src/components/ui/popover.jsx`
> - `src/components/ui/tooltip.jsx`

#### Popover
```jsx
<Popover>
  <PopoverTrigger>Filtrar</PopoverTrigger>
  <PopoverContent className="w-80">
    {/* Contenido del popover */}
  </PopoverContent>
</Popover>
```

#### Tooltip
```jsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <InfoIcon className="h-4 w-4" />
    </TooltipTrigger>
    <TooltipContent>
      <p>Información adicional</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### 3.8 DropdownMenu / Command

> **Sources:**
> - `src/components/ui/dropdown-menu.jsx`
> - `src/components/ui/command.jsx`
> - `src/stories/ui/DropDownMenu.stories.jsx`
> - `src/stories/ui/Command.stories.jsx`

#### DropdownMenu
```jsx
<DropdownMenu>
  <DropdownMenuTrigger>Acciones</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuItem>Duplicar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Command (Command Palette)
```jsx
<Command>
  <CommandInput placeholder="Buscar..." />
  <CommandList>
    <CommandEmpty>Sin resultados</CommandEmpty>
    <CommandGroup heading="Productos">
      <CommandItem>Producto 1</CommandItem>
      <CommandItem>Producto 2</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

### 3.9 Tabs / Accordion / Collapsible

#### Tabs
```jsx
<Tabs defaultValue="info">
  <TabsList>
    <TabsTrigger value="info">Información</TabsTrigger>
    <TabsTrigger value="history">Historial</TabsTrigger>
  </TabsList>
  <TabsContent value="info">...</TabsContent>
  <TabsContent value="history">...</TabsContent>
</Tabs>
```

#### Accordion
```jsx
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Sección 1</AccordionTrigger>
    <AccordionContent>Contenido expandible</AccordionContent>
  </AccordionItem>
</Accordion>
```

### 3.10 Table

> **Source:** `src/components/ui/table.jsx`
> **Story:** `src/stories/ui/Table.stories.jsx`

Componente estructural: `<Table>` > `<TableHeader>` > `<TableRow>` > `<TableHead>` + `<TableBody>` > `<TableRow>` > `<TableCell>`.

```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Precio</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Producto A</TableCell>
      <TableCell>$100</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

> **Nota:** Para tablas complejas con paginación, filtros y sorting, usar **DataTable** (ver [sección 4.1](#41-datatable)).

### 3.11 Form

> **Source:** `src/components/ui/form.jsx`
> **Story:** `src/stories/ui/Form.stories.jsx`

Wrapper sobre react-hook-form con integración Zod. Usa composición de componentes:

```jsx
const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { name: '' },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nombre</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormDescription>Nombre del producto</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Guardar</Button>
  </form>
</Form>
```

### 3.12 Toast / Toaster

> **Sources:**
> - `src/components/ui/toast.jsx`
> - `src/components/ui/toaster.jsx`
> - `src/components/ui/use-toast.js`
> - `src/stories/ui/Toast.stories.jsx`

```jsx
const { toast } = useToast();

toast({
  title: "Producto creado",
  description: "El producto se ha creado exitosamente",
  variant: "success", // default | destructive | success | info | warning
});
```

### 3.13 Badge / Alert / Separator / ScrollArea

#### Badge
```jsx
<Badge variant="default">Activo</Badge>
<Badge variant="secondary">Borrador</Badge>
<Badge variant="destructive">Bloqueado</Badge>
<Badge variant="outline">Custom</Badge>
```

#### Alert
```jsx
<Alert variant="default">
  <AlertTitle>Información</AlertTitle>
  <AlertDescription>Detalle del mensaje.</AlertDescription>
</Alert>
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Ocurrió un problema.</AlertDescription>
</Alert>
```

### 3.14 Calendar / Carousel

#### Calendar
```jsx
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  initialFocus
/>
```

#### Carousel
```jsx
<Carousel>
  <CarouselContent>
    <CarouselItem>Slide 1</CarouselItem>
    <CarouselItem>Slide 2</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
```

### 3.15 Pagination

> **Source:** `src/components/ui/pagination.jsx`

```jsx
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

### 3.16 Label

> **Source:** `src/components/ui/label.jsx`

```jsx
<Label htmlFor="email">Correo electrónico</Label>
```

---

## 4. Componentes Compuestos

### 4.1 DataTable

> **Source:** `src/components/dataTable/`
> **Archivos:** `dataTable.jsx`, `Filter.jsx`, `Pagination.jsx`, `CellWithTooltip.jsx`, `DebouncedInput.jsx`

Tabla avanzada construida sobre **TanStack React Table** con:

#### Características

| Feature | Implementación |
|---------|---------------|
| Paginación | Manual (server-side), configurable: 10, 20, 30, 40, 50 |
| Sorting | Por columna, server-side |
| Filtros | Por columna: texto, rango numérico, select |
| Tooltips | `CellWithTooltip` para celdas truncadas |
| Debounce | `DebouncedInput` para filtros de texto |
| Loading state | Skeleton o spinner mientras carga |
| Empty state | Mensaje "Sin datos" cuando no hay resultados |

#### Estructura

```jsx
<DataTable
  columns={columns}
  data={data}
  totalPages={totalPages}
  page={page}
  setPage={setPage}
  pageSize={pageSize}
  setPageSize={setPageSize}
  isLoading={isLoading}
/>
```

#### Columnas

```jsx
const columns = [
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => (
      <CellWithTooltip text={row.original.name} maxLength={30} />
    ),
  },
  {
    accessorKey: 'price',
    header: 'Precio',
    filterType: 'range', // Filtro de rango numérico
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger>...</DropdownMenuTrigger>
        {/* acciones */}
      </DropdownMenu>
    ),
  },
];
```

### 4.2 TiptapEditor

> **Source:** `src/components/tiptap/`
> **Archivos:** `TiptapEditor.jsx`, `MenuBar.jsx`, `MentionList.jsx`

Editor rich text basado en **Tiptap** (ProseMirror wrapper).

#### Extensiones

| Extensión | Propósito |
|-----------|-----------|
| StarterKit | Bold, italic, strike, code, heading, bulletList, orderedList, blockquote |
| Underline | Texto subrayado |
| Link | Enlaces clickeables |
| Highlight | Resaltado de texto |
| TextAlign | Alineación (left, center, right, justify) |
| Subscript / Superscript | Notas al pie |
| Placeholder | Placeholder personalizado |
| CharacterCount | Contador de caracteres |
| Mention | Menciones (@usuario) con dropdown |

```jsx
<TiptapEditor
  content={initialContent}
  onChange={(html) => setContent(html)}
  editable={true}
/>
```

### 4.3 DebouncedInput

> **Source:** `src/components/dataTable/DebouncedInput.jsx`

Input con debounce para búsqueda en tiempo real sin saturar el servidor.

```jsx
<DebouncedInput
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Buscar..."
  debounce={500}
/>
```

### 4.4 PaginationControls

> **Source:** `src/components/PaginationControls.jsx`

Control de paginación reutilizable para DataTable.

```
<< < Página X de Y | Ir a página: [___] > >>
Mostrar: [10 ▼] registros por página
```

---

## 5. Layout y Routing

### 5.1 Layout Principal

```
<Header>
  └── Logo / Nav / UserMenu / ThemeToggle
<Main>
  └── <Outlet /> (React Router)
<Footer>
  └── Copyright / Links
```

> **Sources:** `src/components/layout/Header.jsx`, `Main.jsx`, `Footer.jsx`

### 5.2 Routing Tree

React Router 7 con lazy loading:

| Ruta | Componente | Guard |
|------|-----------|-------|
| `/` | Home | — |
| `/login` | Login | — |
| `/dashboard` | Dashboard | ProtectedRoutes |
| `/products/*` | Products | ProtectedRoutes |
| `/products/:id` | ProductDetail | ProtectedRoutes |
| `/clients/*` | Clients | ProtectedRoutes |
| `*` | NotFound | — |

### 5.3 Guards

| Guard | Función |
|-------|---------|
| `ProtectedRoutes` | Redirige a `/login` si no hay sesión activa |
| `ProtectedFormRoute` | Verifica permisos específicos para acceder a formularios |

### 5.4 Páginas de Error

| Ruta | Componente | Propósito |
|------|-----------|-----------|
| `/404` | `NotFound` | Ruta no encontrada |
| `/500` | `ErrorBoundary` | Error interno con ErrorBoundary de react-error-boundary |

---

## 6. Patrones de Uso

### 6.1 Form Pattern

Composición: **react-hook-form** + **Zod schema** + **shadcn Form** + **Button**.

```jsx
const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'user']),
});

function UserForm({ onSubmit, defaultValues }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  );
}
```

### 6.2 CRUD Module Pattern

Cada módulo sigue esta estructura:

```
modules/product/
├── components/
│   ├── ProductForm.jsx       # Formulario (Zod + react-hook-form)
│   ├── ProductTable.jsx      # DataTable con columnas
│   └── ProductFilters.jsx    # Filtros específicos
├── api/
│   └── productAPI.js         # RTK Query injectEndpoints
├── pages/
│   ├── ProductList.jsx       # Lista con DataTable
│   ├── ProductCreate.jsx     # Crear (Dialog + Form)
│   ├── ProductEdit.jsx       # Editar (Dialog + Form)
│   └── ProductDetail.jsx     # Detalle (Card)
├── utils/
│   └── productUtils.js
└── index.js                  # Lazy exports
```

### 6.3 Data Fetching Pattern

```jsx
// 1. Definir endpoint en el API slice
const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: (params) => ({ url: '/products', params }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Products', id })), { type: 'Products', id: 'LIST' }]
          : [{ type: 'Products', id: 'LIST' }],
    }),
    createProduct: builder.mutation({
      query: (data) => ({ url: '/products', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),
  }),
});

// 2. Usar en componente
function ProductList() {
  const { data, isLoading } = useGetAllProductsQuery({ page, pageSize });
  const [createProduct] = useCreateProductMutation();

  if (isLoading) return <Loader />;
  return <DataTable data={data} />;
}
```

### 6.4 Authentication Flow

1. Login → JWT token almacenado en cookie + sessionStorage
2. Redux store (auth slice) decodea JWT para user info y roles
3. ProtectedRoutes verifica token existente
4. Axios interceptor añade `Authorization: Bearer <token>`
5. Refresh token automático via Axios interceptor
6. Logout → limpia cookie + sessionStorage + Redux + redirige a `/login`

### 6.5 i18n Pattern

```jsx
import { useTranslation } from 'react-i18next';

function WelcomeMessage() {
  const { t } = useTranslation();
  return <h1>{t('welcome.title')}</h1>;
}
```

**Zod i18n:** Errores de validación traducidos automáticamente vía `config/zod-i18n.js`.

### 6.6 Socket.io Integration

```jsx
const { socket, isConnected } = useSocket();
socket.emit('mention', { userId, noteId });
```

Usado para notificaciones de menciones en tiempo real.

### 6.7 ErrorBoundary Pattern

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Algo salió mal:</p>
      <pre>{error.message}</pre>
      <Button onClick={resetErrorBoundary}>Reintentar</Button>
    </div>
  );
}

<ErrorBoundary FallbackComponent={Fallback}>
  <ProductList />
</ErrorBoundary>
```

---

## 7. Iconografía

### 7.1 Librerías

| Librería | Uso | Ejemplo |
|----------|-----|---------|
| **Lucide React** v0.475.0 | Librería primaria, iconos default | `import { Plus, Edit, Trash2 } from 'lucide-react'` |
| **Radix UI Icons** v1.3.0 | Contexto Radix (menús, select) | `import { ChevronDownIcon } from '@radix-ui/react-icons'` |
| **React Icons** v5.4.0 | Iconos específicos de Material Design | `import { MdOutlineDarkMode } from 'react-icons/md'` |

### 7.2 Convenciones

- **Tamaño:** Los iconos heredan tamaño vía `[&_svg]:size-4` en botones (16x16). Usar `className="h-5 w-5"` para standalone.
- **Color:** Usar `currentColor` para heredar del texto. Aplicar `className="text-muted-foreground"` si se necesita variación.
- **Naming:** PascalCase, import default.
- **Accesibilidad:** `aria-hidden="true"` (default en Lucide) o `aria-label` para iconos interactivos.

```jsx
<Button variant="outline" size="icon">
  <Plus className="h-4 w-4" />
</Button>
```

---

## 8. Testing y Calidad

### 8.1 Estrategia

| Tipo | Archivo | Stack | Cuándo |
|------|---------|-------|--------|
| Unit | `*.unit.test.jsx` | Vitest + vi.mock | Componentes puros, hooks, utils |
| Integration | `*.integration.test.jsx` | MSW + Redux real | Flujos completos con API |
| Storybook | `*.stories.jsx` | Storybook test runner | Regresión visual, interaction testing |

### 8.2 Setup

```bash
vitest run                          # Tests unitarios
vitest run --coverage               # Con cobertura
vitest run src/components/Button.unit.test.jsx  # Test específico
```

### 8.3 MSW Setup

```js
// tests/setup/msw/server.js
import { setupServer } from 'msw/node';
export const server = setupServer(...handlers);
```

### 8.4 Coverage Thresholds (objetivo)

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

---

## 9. Theming y Personalización

### 9.1 CSS Variables Structure

Las variables se definen en `src/index.css` en dos bloques:

1. `:root` — valores del tema claro
2. `.dark` — overrides del tema oscuro

### 9.2 Cómo Extender Tokens

Para añadir un nuevo color semántico:

1. Añadir CSS variable en `:root` y `.dark` en `index.css`
2. Registrar en `tailwind.config.js` dentro de `extend.colors`
3. Usar como `bg-{name}`, `text-{name}-foreground`

### 9.3 Cómo Añadir un Nuevo Componente shadcn

```bash
npm exec shadcn-ui@latest -- add button
```

El componente se añade a `src/components/ui/` y puede personalizarse.

### 9.4 shadcn Style

| Config | Valor |
|--------|-------|
| Style | `new-york` |
| Base color | `zinc` |
| CSS variables | `true` |
| Icon library | `lucide` |

---

## 10. Storybook

### 10.1 Configuración

| Archivo | Propósito |
|---------|-----------|
| `.storybook/main.js` | Configuración: stories path, addons, framework |
| `.storybook/preview.js` | Preview: decorators, autodocs, parámetros globales |

### 10.2 Addons Instalados

| Addon | Propósito |
|-------|-----------|
| `@storybook/addon-essentials` | Controls, Actions, Docs, Viewport |
| `@storybook/addon-interactions` | Testing de interacciones |
| `@storybook/addon-links` | Navegación entre stories |
| `@storybook/addon-styling-webpack` | Soporte de estilos |

### 10.3 Formato de Stories (CSF 3.0)

```jsx
export default {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
  },
};

const Template = (args) => <Button {...args}>Click me</Button>;

export const Default = Template.bind({});
Default.args = { variant: 'default', size: 'default' };

export const Destructive = Template.bind({});
Destructive.args = { variant: 'destructive' };
```

### 10.4 Organización

```
stories/
├── ui/           # Stories de UI primitives (Button, Card, Dialog, etc.)
├── pages/        # Stories de páginas completas (futuro)
├── assets/       # Recursos visuales
└── Configure.mdx # Documentación de Storybook
```

### 10.5 Coverage Actual

| Estado | Componentes |
|--------|-------------|
| ✅ Con story | Button, Card, Dialog, AlertDialog, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Toggle, Popover, Tooltip, DropdownMenu, Command, Tabs, Table, Form, Label, Separator, ScrollArea, Calendar, Toast, Toaster |
| ❌ Sin story | Accordion, Alert, Badge, Carousel, Collapsible, Pagination |

---

## 11. Contribución y Mantenimiento

### 11.1 Añadir un Nuevo Componente UI

1. Instalar vía shadcn CLI: `npm exec shadcn-ui@latest -- add <component>`
2. Personalizar styles si necesario
3. Añadir PropTypes
4. Crear Storybook story en `src/stories/ui/`
5. Añadir tests unitarios
6. Documentar en este DESIGN.md

### 11.2 Modificar Tokens

1. Cambiar CSS variables en `src/index.css`
2. Actualizar `tailwind.config.js` si se añaden nuevos tokens
3. Verificar modo oscuro: probar ambos temas
4. Verificar Storybook: stories deben reflejar cambios visuales
5. Actualizar sección 2 de este documento

### 11.3 Code Review Checklist

- [ ] ¿Usa `cn()` para className merging?
- [ ] ¿Tiene `forwardRef` + `displayName`?
- [ ] ¿Tiene PropTypes?
- [ ] ¿States cubiertos: loading, empty, error, disabled?
- [ ] ¿Responsive con Tailwind breakpoints?
- [ ] ¿Accesible: roles ARIA, keyboard navigation?
- [ ] ¿Storybook story creada/actualizada?
- [ ] ¿Tests: unitarios e integración?
- [ ] ¿i18n implementado?
- [ ] ¿Dark mode probado?

### 11.4 Versionado

Este design system sigue el versionado semántico del proyecto (`package.json`). Los cambios mayores (breaking changes en tokens o componentes) incrementan la versión major.

### 11.5 Recursos Relacionados

| Documento | Contenido |
|-----------|-----------|
| `docs/code-style.md` | Convenciones de código y formato |
| `docs/architectural-approach.md` | Patrones de arquitectura y decisiones técnicas |
| `docs/testing-architecture.md` | Estrategia completa de testing |
| `AGENTS.md` | Guías de desarrollo asistido por agentes |

---

> **Este es un documento vivo.**  
> Actualízalo cuando se añadan nuevos componentes, tokens o patrones.
> Cada cambio en el design system debe reflejarse aquí para mantener la consistencia del proyecto.
