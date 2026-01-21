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
import { LuPlus, LuEraser } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

export function NotesFilters({
  onSearch,
  onSearchStatus,
  dataStatus,
  filters,
  handleReset,
  setOpen,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-5">
      <div className="flex-1 max-w-md">
        <Label htmlFor="textSearch">{t('search')}</Label>
        <Input
          id="textSearch"
          type="text"
          maxLength={150}
          placeholder={t('search_notes')}
          className="py-2 pr-4"
          onChange={(e) => {
            onSearch(e.target.value);
          }}
          value={filters.searchTerm}
        />
      </div>
      <div className="flex-1 max-w-md">
        <Label htmlFor="statusNotes">{t('status')}</Label>
        <Select
          id="statusNotes"
          onValueChange={(code) => {
            if (code) {
              onSearchStatus(code);
            }
          }}
          value={filters.statusCode}
          defaultValue={filters.statusCode}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('select_status')} />
          </SelectTrigger>
          <SelectContent>
            {dataStatus.map((col) => (
              <SelectItem key={col.id} value={col.code}>
                {col.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
    </div>
  );
}

NotesFilters.propTypes = {
  onSearch: PropTypes.func,
  onSearchStatus: PropTypes.func,
  dataStatus: PropTypes.array,
  filters: PropTypes.object,
  handleReset: PropTypes.func,
  setOpen: PropTypes.func,
};
