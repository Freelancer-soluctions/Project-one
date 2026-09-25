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
    const color = s.card.match(/border-(\w+)-200/)?.[1] ?? 'gray';
    return [
      code,
      {
        alert: cn(
          `border-${color}-200 bg-${color}-50/50`,
          `hover:bg-${color}-100/50`,
          'cursor-pointer'
        ),
        text: `text-${color}-700`,
      },
    ];
  })
);

/** Definición de cada alerta de estado: clave i18n + columna. */
const NOTE_STATUS_ALERTS = [
  {
    countKey: 'backlog',
    labelKey: 'backlog_notes',
    status: StatusColumn.BACKLOG,
  },
  { countKey: 'active', labelKey: 'active_notes', status: StatusColumn.ACTIVE },
  {
    countKey: 'completed',
    labelKey: 'completed_notes',
    status: StatusColumn.COMPLETED,
  },
];

/** Alerta navegable con el conteo de notas de un estado. */
function buildStatusAlert({ t, navigate, scope, data, def }) {
  const count = data?.[def.countKey];
  if (!count || count <= 0) return null;

  const styles = STATUS_STYLES[def.status];
  return (
    <Alert
      className={styles.alert}
      onClick={() =>
        navigate('notes', { state: { filter: def.status, scope } })
      }
    >
      <AlertDescription className="flex items-center justify-between">
        <span>{t(def.labelKey)}</span>
        <div className="flex items-center gap-2">
          <span className={cn('font-semibold', styles.text)}>{count}</span>
          <LuArrowRight className={cn('w-4 h-4', styles.text)} />
        </div>
      </AlertDescription>
    </Alert>
  );
}

/** Skeleton de carga del resumen. */
function SummarySkeleton({ t }) {
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

SummarySkeleton.propTypes = {
  t: PropTypes.func.isRequired,
};

export function NotesSummary({ scope = 'mine' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: dataCountNotes, isLoading } = useGetAllCountNotesQuery({
    scope,
  });

  if (isLoading) {
    return <SummarySkeleton t={t} />;
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t('status_notes')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {NOTE_STATUS_ALERTS.map((def) =>
            buildStatusAlert({
              t,
              navigate,
              scope,
              data: dataCountNotes?.data,
              def,
            })
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
