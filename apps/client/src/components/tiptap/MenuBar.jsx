import PropTypes from 'prop-types';
import * as React from 'react';

import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Link as LinkIcon,
  Unlink,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  RemoveFormatting,
  Minus,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

/**
 * Grupo 1: formato de texto básico (negrita, itálica, subrayado, tachado,
 * código, resaltado).
 */
const TEXT_FORMAT_TOGGLES = [
  {
    icon: Bold,
    isActive: (e) => e.isActive('bold'),
    run: (c) => c.toggleBold(),
    label: 'Toggle bold',
  },
  {
    icon: Italic,
    isActive: (e) => e.isActive('italic'),
    run: (c) => c.toggleItalic(),
    label: 'Toggle italic',
  },
  {
    icon: UnderlineIcon,
    isActive: (e) => e.isActive('underline'),
    run: (c) => c.toggleUnderline(),
    label: 'Toggle underline',
  },
  {
    icon: Strikethrough,
    isActive: (e) => e.isActive('strike'),
    run: (c) => c.toggleStrike(),
    label: 'Toggle strikethrough',
  },
  {
    icon: Code,
    isActive: (e) => e.isActive('code'),
    run: (c) => c.toggleCode(),
    label: 'Toggle code',
  },
  {
    icon: Highlighter,
    isActive: (e) => e.isActive('highlight'),
    run: (c) => c.toggleHighlight(),
    label: 'Toggle highlight',
  },
];

/**
 * Grupo 2: superíndice y subíndice.
 */
const SCRIPT_TOGGLES = [
  {
    icon: SuperscriptIcon,
    isActive: (e) => e.isActive('superscript'),
    run: (c) => c.toggleSuperscript(),
    label: 'Toggle superscript',
  },
  {
    icon: SubscriptIcon,
    isActive: (e) => e.isActive('subscript'),
    run: (c) => c.toggleSubscript(),
    label: 'Toggle subscript',
  },
];

/**
 * Grupo 3: encabezados (H1–H3).
 */
const HEADING_TOGGLES = [
  {
    icon: Heading1,
    isActive: (e) => e.isActive('heading', { level: 1 }),
    run: (c) => c.toggleHeading({ level: 1 }),
    label: 'Toggle heading 1',
  },
  {
    icon: Heading2,
    isActive: (e) => e.isActive('heading', { level: 2 }),
    run: (c) => c.toggleHeading({ level: 2 }),
    label: 'Toggle heading 2',
  },
  {
    icon: Heading3,
    isActive: (e) => e.isActive('heading', { level: 3 }),
    run: (c) => c.toggleHeading({ level: 3 }),
    label: 'Toggle heading 3',
  },
];

/**
 * Grupo 4: alineación de texto.
 */
const ALIGN_TOGGLES = [
  {
    icon: AlignLeft,
    isActive: (e) => e.isActive({ textAlign: 'left' }),
    run: (c) => c.setTextAlign('left'),
    label: 'Align left',
  },
  {
    icon: AlignCenter,
    isActive: (e) => e.isActive({ textAlign: 'center' }),
    run: (c) => c.setTextAlign('center'),
    label: 'Align center',
  },
  {
    icon: AlignRight,
    isActive: (e) => e.isActive({ textAlign: 'right' }),
    run: (c) => c.setTextAlign('right'),
    label: 'Align right',
  },
  {
    icon: AlignJustify,
    isActive: (e) => e.isActive({ textAlign: 'justify' }),
    run: (c) => c.setTextAlign('justify'),
    label: 'Align justify',
  },
];

/**
 * Grupo 5: listas y citas.
 */
const LIST_TOGGLES = [
  {
    icon: List,
    isActive: (e) => e.isActive('bulletList'),
    run: (c) => c.toggleBulletList(),
    label: 'Toggle bullet list',
  },
  {
    icon: ListOrdered,
    isActive: (e) => e.isActive('orderedList'),
    run: (c) => c.toggleOrderedList(),
    label: 'Toggle ordered list',
  },
  {
    icon: Quote,
    isActive: (e) => e.isActive('blockquote'),
    run: (c) => c.toggleBlockquote(),
    label: 'Toggle blockquote',
  },
];

/**
 * Grupo 6: acciones simples sin estado activo (línea, limpiar formato,
 * deshacer/rehacer). `canRun` habilita/deshabilita el botón.
 */
const ACTION_TOGGLES = [
  {
    icon: Minus,
    isActive: () => false,
    run: (c) => c.setHorizontalRule(),
    label: 'Add horizontal rule',
  },
  {
    icon: RemoveFormatting,
    isActive: () => false,
    run: (c) => c.unsetAllMarks().clearNodes(),
    label: 'Clear formatting',
  },
  {
    icon: Undo,
    isActive: () => false,
    run: (c) => c.undo(),
    label: 'Undo',
    canRun: (e) => e.can().undo(),
  },
  {
    icon: Redo,
    isActive: () => false,
    run: (c) => c.redo(),
    label: 'Redo',
    canRun: (e) => e.can().redo(),
  },
];

/**
 * Botón de la barra: envuelve un Toggle de shadcn con la convención
 * editor.chain().focus()...run() del editor TipTap.
 *
 * @param {Object} p - Props del botón.
 * @param {Object} p.editor - Instancia del editor TipTap.
 * @param {Object} p.def - Definición del toggle (icon/isActive/run/label/canRun/pressed/disabled/onPressedChange).
 * @returns {JSX.Element} Toggle listo.
 */
const ToolbarToggle = ({ editor, def }) => (
  <Toggle
    size="sm"
    pressed={def.pressed ? def.pressed(editor) : def.isActive(editor)}
    onPressedChange={
      def.onPressedChange || (() => def.run(editor.chain().focus()).run())
    }
    disabled={def.disabled ? def.disabled(editor) : false}
    aria-label={def.label}
  >
    <def.icon className="h-4 w-4" />
  </Toggle>
);

ToolbarToggle.propTypes = {
  editor: PropTypes.object.isRequired,
  def: PropTypes.object.isRequired,
};

/**
 * Renderiza un grupo de toggles separado por un divisor vertical.
 *
 * @param {Object} p - Props del grupo.
 * @param {Object} p.editor - Instancia del editor TipTap.
 * @param {Array<Object>} p.toggles - Definiciones de toggles del grupo.
 * @param {boolean} [p.dividerAfter=true] - Pintar divisor después del grupo.
 * @returns {JSX.Element} Fragmento con los toggles (+ divisor).
 */
const ToggleGroup = ({ editor, toggles, dividerAfter = true }) => (
  <>
    {toggles.map((def) => (
      <ToolbarToggle key={def.label} editor={editor} def={def} />
    ))}
    {dividerAfter && <div className="mx-1 w-px bg-border" />}
  </>
);

ToggleGroup.propTypes = {
  editor: PropTypes.object.isRequired,
  toggles: PropTypes.array.isRequired,
  dividerAfter: PropTypes.bool,
};

/**
 * Definiciones de los toggles de Links (necesitan setLink del componente).
 *
 * @param {Function} setLink - Callback que pide la URL y aplica el link.
 * @returns {Array<Object>} Toggles del grupo Links.
 */
const buildLinkToggles = (setLink) => [
  {
    icon: LinkIcon,
    isActive: (e) => e.isActive('link'),
    onPressedChange: setLink,
    label: 'Add link',
  },
  {
    icon: Unlink,
    isActive: () => false,
    run: (c) => c.unsetLink(),
    disabled: (e) => !e.isActive('link'),
    label: 'Remove link',
  },
];

export const MenuBar = ({ editor }) => {
  const setLink = React.useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const linkToggles = buildLinkToggles(setLink);

  return (
    <div className="flex flex-wrap gap-1 border-b border-border p-1">
      {/* Formato de texto básico */}
      <ToggleGroup editor={editor} toggles={TEXT_FORMAT_TOGGLES} />

      {/* Superscript y Subscript */}
      <ToggleGroup editor={editor} toggles={SCRIPT_TOGGLES} />

      {/* Encabezados */}
      <ToggleGroup editor={editor} toggles={HEADING_TOGGLES} />

      {/* Alineación de texto */}
      <ToggleGroup editor={editor} toggles={ALIGN_TOGGLES} />

      {/* Listas y citas */}
      <ToggleGroup editor={editor} toggles={LIST_TOGGLES} />

      {/* Links */}
      <ToggleGroup editor={editor} toggles={linkToggles} />

      {/* Línea horizontal, limpiar formato, deshacer y rehacer */}
      <ToggleGroup
        editor={editor}
        toggles={ACTION_TOGGLES}
        dividerAfter={false}
      />
    </div>
  );
};

MenuBar.propTypes = {
  editor: PropTypes.any,
};
