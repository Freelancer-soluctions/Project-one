'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import { X, Search, Pencil, Plus, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

/**
 * @typedef {Object} HashtagItem
 * @property {string} id
 * @property {string} name
 */

/**
 * @param {Object} props
 * @param {HashtagItem[]} props.hashtags
 * @param {string[]} [props.selectedIds]
 * @param {(selectedIds: string[]) => void} [props.onSelectionChange]
 * @param {(hashtag: HashtagItem) => void} [props.onEdit]
 * @param {(hashtag: HashtagItem) => void} [props.onDelete]
 * @param {() => void} [props.onCreate]
 * @param {() => void} [props.onClose]
 * @param {string} [props.title]
 * @param {string} [props.searchPlaceholder]
 * @param {string} [props.createButtonText]
 * @param {string} [props.className]
 */
export function HashtagsSelector({
  hashtags,
  selectedIds = [],
  onSelectionChange,
  onEdit,
  onDelete,
  onCreate,
  onClose,
  title,
  searchPlaceholder,
  createButtonText,
  className,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState(selectedIds);

  const resolvedTitle = title || t('hashtags_title');
  const resolvedSearchPlaceholder =
    searchPlaceholder || t('hashtags_search_placeholder');
  const resolvedCreateButtonText =
    createButtonText || t('hashtags_create_button');

  const filteredHashtags = React.useMemo(() => {
    if (!search.trim()) return hashtags;
    return hashtags.filter((hashtag) =>
      hashtag.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [hashtags, search]);

  const handleToggle = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    setSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  React.useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds]);

  return (
    <div
      className={cn(
        'w-72 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">{resolvedTitle}</h3>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t('close')}</span>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={resolvedSearchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Hashtags list */}
      <div className="px-3 pb-2">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {resolvedTitle}
        </p>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {filteredHashtags.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t('hashtags_no_hashtags_found')}
            </p>
          ) : (
            filteredHashtags.map((hashtag) => {
              const isSelected = selected.includes(hashtag.id);
              return (
                <div
                  key={hashtag.id}
                  className="group flex items-center gap-2 rounded-md"
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(hashtag.id)}
                    className={cn(
                      'flex h-9 flex-1 items-center gap-3 rounded-md px-2 text-left text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent/50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-transparent'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="flex-1 truncate">{hashtag.name}</span>
                  </button>
                  {onEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => onEdit(hashtag)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">
                        {t('hashtags_edit_hashtag', { name: hashtag.name })}
                      </span>
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:text-destructive"
                      onClick={() => onDelete(hashtag)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">
                        {t('hashtags_delete_hashtag', { name: hashtag.name })}
                      </span>
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create button */}
      {onCreate && (
        <div className="border-t border-border p-3">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" />
            {resolvedCreateButtonText}
          </Button>
        </div>
      )}
    </div>
  );
}

HashtagsSelector.propTypes = {
  hashtags: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedIds: PropTypes.arrayOf(PropTypes.string),
  onSelectionChange: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onCreate: PropTypes.func,
  onClose: PropTypes.func,
  title: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  createButtonText: PropTypes.string,
  className: PropTypes.string,
};
