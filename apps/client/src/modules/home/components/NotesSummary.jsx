import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LuArrowRight } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { StatusColumn } from '@/modules/notes/utils/enums';
import { COLUMN_STYLES } from '@/modules/notes/utils/noteStyles';
import { useGetAllCountNotesQuery } from '@/modules/notes/api/notesAPI';
import PropTypes from 'prop-types';

// Derive alert styles from COLUMN_STYLES to stay in sync with note card colors
const STATUS_STYLES = Object.fromEntries(
  Object.entries(COLUMN_STYLES).map(([code, s]) => {
    const color = s.card.match(/border-(\w+)-200/)?.[1] ?? 'gray'
    return [code, {
      alert: cn(`border-${color}-200 bg-${color}-50/50`, `hover:bg-${color}-100/50`, 'cursor-pointer'),
      text: `text-${color}-700`,
    }]
  })
)

export function NotesSummary({ scope = 'mine' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: dataCountNotes, isLoading } = useGetAllCountNotesQuery({ scope });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>{t('status_notes')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <p className="text-center">{t('loading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t('status_notes')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {dataCountNotes?.data.backlog > 0 && (
            <Alert
              className={STATUS_STYLES[StatusColumn.BACKLOG].alert}
              onClick={() =>
                navigate('notes', { state: { filter: StatusColumn.BACKLOG, scope } })
              }
            >
              <AlertDescription className="flex items-center justify-between">
                <span>{t('backlog_notes')}</span>
                <div className="flex items-center gap-2">
                  <span className={cn('font-semibold', STATUS_STYLES[StatusColumn.BACKLOG].text)}>
                    {dataCountNotes.data.backlog}
                  </span>
                  <LuArrowRight className={cn('w-4 h-4', STATUS_STYLES[StatusColumn.BACKLOG].text)} />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {dataCountNotes?.data.active > 0 && (
            <Alert
              className={STATUS_STYLES[StatusColumn.ACTIVE].alert}
              onClick={() =>
                navigate('notes', { state: { filter: StatusColumn.ACTIVE, scope } })
              }
            >
              <AlertDescription className="flex items-center justify-between">
                <span>{t('active_notes')}</span>
                <div className="flex items-center gap-2">
                  <span className={cn('font-semibold', STATUS_STYLES[StatusColumn.ACTIVE].text)}>
                    {dataCountNotes.data.active}
                  </span>
                  <LuArrowRight className={cn('w-4 h-4', STATUS_STYLES[StatusColumn.ACTIVE].text)} />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {dataCountNotes?.data.completed > 0 && (
            <Alert
              className={STATUS_STYLES[StatusColumn.COMPLETED].alert}
              onClick={() =>
                navigate('notes', { state: { filter: StatusColumn.COMPLETED, scope } })
              }
            >
              <AlertDescription className="flex items-center justify-between">
                <span>{t('completed_notes')}</span>
                <div className="flex items-center gap-2">
                  <span className={cn('font-semibold', STATUS_STYLES[StatusColumn.COMPLETED].text)}>
                    {dataCountNotes.data.completed}
                  </span>
                  <LuArrowRight className={cn('w-4 h-4', STATUS_STYLES[StatusColumn.COMPLETED].text)} />
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => navigate('notes', { state: { filter: '', scope } })}
        >
          {t('show_all_notes')}
        </Button>
      </CardContent>
    </Card>
  );
}

NotesSummary.propTypes = {
  scope: PropTypes.string,
};
