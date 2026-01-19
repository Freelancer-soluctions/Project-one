import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LuArrowRight } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { StatusColumn } from '@/modules/notes/utils/enums';
import PropTypes from 'prop-types';

export function NotesSummary({ dataCountNotes }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t('status_notes')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {dataCountNotes?.data.low > 0 && (
            <Alert
              className={cn(
                'border-green-200 bg-green-50/50 transition-colors hover:bg-green-100/50 cursor-pointer'
              )}
              onClick={() =>
                navigate('notes', { state: { filter: StatusColumn.LOW } })
              }
            >
              <AlertDescription className="flex items-center justify-between">
                <span>{t('low_notes')}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-700">
                    {dataCountNotes.data.low}
                  </span>
                  <LuArrowRight className="w-4 h-4 text-green-700" />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {dataCountNotes?.data.medium > 0 && (
            <Alert
              className={cn(
                'border-yellow-200 bg-yellow-50/50 transition-colors hover:bg-yellow-100/50 cursor-pointer'
              )}
              onClick={() =>
                navigate('notes', { state: { filter: StatusColumn.MEDIUM } })
              }
            >
              <AlertDescription className="flex items-center justify-between">
                <span>{t('medium_notes')}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-yellow-700">
                    {dataCountNotes.data.medium}
                  </span>
                  <LuArrowRight className="w-4 h-4 text-yellow-700" />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {dataCountNotes?.data.high > 0 && (
            <Alert
              className={cn(
                'border-red-200 bg-red-50/50 transition-colors hover:bg-red-100/50 cursor-pointer'
              )}
              onClick={() =>
                navigate('notes', { state: { filter: StatusColumn.HIGH } })
              }
            >
              <AlertDescription className="flex items-center justify-between">
                <span>{t('high_notes')}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-red-700">
                    {dataCountNotes.data.high}
                  </span>
                  <LuArrowRight className="w-4 h-4 text-red-700" />
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => navigate('notes', { state: { filter: '' } })}
        >
          {t('show_all_notes')}
        </Button>
      </CardContent>
    </Card>
  );
}

NotesSummary.propTypes = {
  dataCountNotes: PropTypes.object.isRequired,
};
