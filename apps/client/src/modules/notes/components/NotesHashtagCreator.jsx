'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import { X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

/**
 * @typedef {Object} EditingHashtag
 * @property {number} id - Hashtag ID
 * @property {string} name - Current hashtag name
 */

/**
 * @param {Object} props
 * @param {() => void} [props.onBack]
 * @param {() => void} [props.onClose]
 * @param {({ title }: { title: string }) => void} [props.onCreate]
 * @param {(hashtag: { id: number, title: string }) => void} [props.onSave]
 * @param {EditingHashtag} [props.editingHashtag]
 * @param {string} [props.className]
 */
export function HashtagCreator({
  onBack,
  onClose,
  onCreate,
  onSave,
  editingHashtag,
  className,
}) {
  const { t } = useTranslation();
  const [title, setTitle] = React.useState(editingHashtag?.name ?? '');

  const isEditing = !!editingHashtag;

  const handleAction = () => {
    if (title.trim()) {
      if (isEditing && onSave) {
        onSave({ id: editingHashtag.id, title: title.trim() });
      } else if (onCreate) {
        onCreate({ title: title.trim() });
      }
      setTitle('');
    }
  };

  return (
    <div
      className={cn(
        'w-72 rounded-lg border bg-popover text-popover-foreground shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">{t('hashtags_back')}</span>
        </Button>
        <span className="text-sm font-medium">
          {isEditing
            ? t('hashtags_edit_hashtag', { name: editingHashtag.name })
            : t('hashtags_create_hashtag')}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t('close')}</span>
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Preview */}
        <div className="flex justify-center">
          <div
            className={cn(
              'h-8 w-48 rounded',
              title.trim() ? 'bg-muted' : 'bg-muted/50'
            )}
          >
            {title.trim() && (
              <div className="flex h-full items-center justify-center px-3">
                <span className="text-sm font-medium truncate text-foreground">
                  {title}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="hashtag-title" className="text-sm">
            {t('title')}
          </Label>
          <Input
            id="hashtag-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder=""
            className="h-9"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAction}
          disabled={!title.trim()}
          className="h-8"
        >
          {isEditing ? t('hashtags_save') : t('hashtags_create')}
        </Button>
      </div>
    </div>
  );
}

HashtagCreator.propTypes = {
  onBack: PropTypes.func,
  onClose: PropTypes.func,
  onCreate: PropTypes.func,
  onSave: PropTypes.func,
  editingHashtag: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }),
  className: PropTypes.string,
};
