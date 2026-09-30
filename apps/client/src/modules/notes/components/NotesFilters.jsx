import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LuPlus, LuEraser, LuTags } from 'react-icons/lu';
import { FavoriteToggle } from '@/components/favoriteToggle/favoriteToggle';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { HashtagsSelector } from './NotesHashtagSelector';
import { HashtagCreator } from './NotesHashtagCreator';
import { useGetHashtagItems, useGetNoteColumns } from '../hooks/index';
import { FIELD_LIMITS } from '@/config/fieldLimits';

/** Search input bound to filters.searchTerm. */
function SearchInput({ value, onSearch }) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 max-w-md">
      <Label htmlFor="textSearch">{t('search')}</Label>
      <Input
        id="textSearch"
        type="text"
        maxLength={FIELD_LIMITS.search.searchTerm}
        placeholder={t('search_notes')}
        className="py-2 pr-4"
        onChange={(e) => {
          onSearch(e.target.value);
        }}
        value={value}
      />
    </div>
  );
}

SearchInput.propTypes = {
  value: PropTypes.string,
  onSearch: PropTypes.func,
};

/** Status select bound to filters.statusCode. */
function StatusFilter({ value, onSearchStatus, dataColumns }) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 max-w-md">
      <Label htmlFor="statusNotes">{t('status')}</Label>
      <Select
        id="statusNotes"
        onValueChange={(code) => {
          if (code) {
            onSearchStatus(code);
          }
        }}
        value={value}
        defaultValue={value}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('select_status')} />
        </SelectTrigger>
        <SelectContent>
          {dataColumns && dataColumns.length > 0 ? (
            dataColumns.map((col) => (
              <SelectItem key={col.id} value={col.code}>
                {col.title}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="loading" disabled>
              {t('loading')}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

StatusFilter.propTypes = {
  value: PropTypes.string,
  onSearchStatus: PropTypes.func,
  dataColumns: PropTypes.array,
};

/** Add / clear action buttons. */
function ActionsRow({ setOpen, handleReset }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-5 md:justify-normal">
      <Button
        className="flex-1 md:flex-initial md:w-24"
        variant="success"
        onClick={() => {
          setOpen(true);
        }}
      >
        {t('add')}
        <LuPlus className="w-5 h-5 ml-auto opacity-50" />
      </Button>
      <Button
        type="button"
        className="flex-1 md:flex-initial md:w-24"
        variant="outline"
        onClick={() => handleReset()}
      >
        {t('clear')} <LuEraser className="w-4 h-4 ml-auto opacity-50" />
      </Button>
    </div>
  );
}

ActionsRow.propTypes = {
  setOpen: PropTypes.func,
  handleReset: PropTypes.func,
};

/** Hashtag popover: selector plus inline creator/editor flow. */
function HashtagPopover({
  showSelector,
  setShowSelector,
  showCreator,
  hashtagItems,
  selectedHashtagIds,
  onHashtagSelectionChange,
  hashtagAdmin,
}) {
  const { t } = useTranslation();
  return (
    <Popover open={showSelector} onOpenChange={setShowSelector}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LuTags className="h-4 w-4" />
          {t('hashtags_title')}
          {selectedHashtagIds.length > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {selectedHashtagIds.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {showCreator ? (
          <HashtagCreator
            onBack={hashtagAdmin.handleBackFromCreator}
            onClose={hashtagAdmin.handleCloseCreator}
            onCreate={hashtagAdmin.handleCreateHashtag}
            onSave={hashtagAdmin.handleSaveHashtag}
            editingHashtag={hashtagAdmin.editingHashtag}
          />
        ) : (
          <HashtagsSelector
            hashtags={hashtagItems}
            selectedIds={selectedHashtagIds.map(String)}
            onSelectionChange={(ids) => {
              onHashtagSelectionChange(ids.map(Number));
            }}
            onEdit={hashtagAdmin.handleStartEdit}
            onDelete={hashtagAdmin.handleDeleteHashtag}
            onCreate={() => hashtagAdmin.setShowCreator(true)}
            onClose={() => setShowSelector(false)}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

HashtagPopover.propTypes = {
  showSelector: PropTypes.bool.isRequired,
  setShowSelector: PropTypes.func.isRequired,
  showCreator: PropTypes.bool.isRequired,
  hashtagItems: PropTypes.array,
  selectedHashtagIds: PropTypes.array,
  onHashtagSelectionChange: PropTypes.func,
  hashtagAdmin: PropTypes.object.isRequired,
};

/** Mine/mixed scope toggle buttons. */
function ScopeToggle({ scope, onScopeChange }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-end gap-1">
      {['mine', 'mixed'].map((s) => (
        <Button
          key={s}
          variant={scope === s ? 'default' : 'outline'}
          size="sm"
          onClick={() => onScopeChange(s)}
        >
          {s === 'mine' ? t('scope_mine') : t('scope_mixed')}
        </Button>
      ))}
    </div>
  );
}

ScopeToggle.propTypes = {
  scope: PropTypes.string,
  onScopeChange: PropTypes.func,
};

/**
 * Hashtag create/edit/delete flow state shared by the selector and creator.
 */
function useHashtagAdmin({ onCreateHashtag, onEditHashtag, onDeleteHashtag }) {
  const [showCreator, setShowCreator] = useState(false);
  const [editingHashtag, setEditingHashtag] = useState(null);

  const handleCreateHashtag = ({ title }) => {
    if (onCreateHashtag) {
      onCreateHashtag({ name: title });
    }
    setShowCreator(false);
  };

  const handleStartEdit = (label) => {
    setEditingHashtag({ id: Number(label.id), name: label.name });
    setShowCreator(true);
  };

  const handleSaveHashtag = ({ id, title }) => {
    if (onEditHashtag) {
      onEditHashtag({ id, name: title });
    }
    setEditingHashtag(null);
    setShowCreator(false);
  };

  const handleDeleteHashtag = (label) => {
    if (onDeleteHashtag) {
      onDeleteHashtag({ id: Number(label.id), name: label.name });
    }
  };

  const handleBackFromCreator = () => {
    setEditingHashtag(null);
    setShowCreator(false);
  };

  const handleCloseCreator = () => {
    setEditingHashtag(null);
    setShowCreator(false);
  };

  return {
    showCreator,
    setShowCreator,
    editingHashtag,
    handleCreateHashtag,
    handleStartEdit,
    handleSaveHashtag,
    handleDeleteHashtag,
    handleBackFromCreator,
    handleCloseCreator,
  };
}

export function NotesFilters({
  onSearch,
  onSearchStatus,
  onFavoriteFilter,
  filters,
  handleReset,
  setOpen,
  selectedHashtagIds = [],
  onHashtagSelectionChange,
  onCreateHashtag,
  onEditHashtag,
  onDeleteHashtag,
  scope,
  onScopeChange,
}) {
  const { t } = useTranslation();
  const [showSelector, setShowSelector] = useState(false);
  const { hashtagItems } = useGetHashtagItems();
  const { dataColumns } = useGetNoteColumns();
  const hashtagAdmin = useHashtagAdmin({
    onCreateHashtag,
    onEditHashtag,
    onDeleteHashtag,
  });

  return (
    <div className="flex flex-wrap gap-5">
      <SearchInput value={filters.searchTerm} onSearch={onSearch} />
      <StatusFilter
        value={filters.statusCode}
        onSearchStatus={onSearchStatus}
        dataColumns={dataColumns}
      />
      <div className="flex items-end gap-2">
        <FavoriteToggle
          checked={filters.isFavorite}
          onChange={(checked) => onFavoriteFilter && onFavoriteFilter(checked)}
          label={t('show_favorites_only')}
          size="sm"
        />
        <HashtagPopover
          showSelector={showSelector}
          setShowSelector={setShowSelector}
          showCreator={hashtagAdmin.showCreator}
          hashtagItems={hashtagItems}
          selectedHashtagIds={selectedHashtagIds}
          onHashtagSelectionChange={onHashtagSelectionChange}
          hashtagAdmin={hashtagAdmin}
        />
      </div>
      <ScopeToggle scope={scope} onScopeChange={onScopeChange} />
      <ActionsRow setOpen={setOpen} handleReset={handleReset} />
    </div>
  );
}

NotesFilters.propTypes = {
  onSearch: PropTypes.func,
  onSearchStatus: PropTypes.func,
  onFavoriteFilter: PropTypes.func,
  filters: PropTypes.object,
  handleReset: PropTypes.func,
  setOpen: PropTypes.func,
  selectedHashtagIds: PropTypes.array,
  onHashtagSelectionChange: PropTypes.func,
  onCreateHashtag: PropTypes.func,
  onEditHashtag: PropTypes.func,
  onDeleteHashtag: PropTypes.func,
  scope: PropTypes.string,
  onScopeChange: PropTypes.func,
};
