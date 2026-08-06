import { useTranslation } from 'react-i18next';
import { useSocket } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LuWifi, LuWifiOff } from 'react-icons/lu';

export function SettingsWsStatus() {
  const { t } = useTranslation();
  const { isConnected, isError } = useSocket();

  const statusColor = isConnected ? 'bg-green-500' : 'bg-red-500';
  const statusText = isConnected ? t('ws_connected') : t('ws_disconnected');
  const StatusIcon = isConnected ? LuWifi : LuWifiOff;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon
            className={`w-5 h-5 ${isConnected ? 'text-green-500' : 'text-red-500'}`}
          />
          {t('ws_status_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection indicator */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-block w-3 h-3 rounded-full ${statusColor}`}
          />
          <span className="text-sm font-medium">{statusText}</span>
        </div>

        {/* Connection details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium min-w-[120px]">{t('ws_status')}:</span>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? t('active') : t('inactive')}
            </Badge>
          </div>
          {isError && (
            <p className="text-destructive text-xs">
              {t('ws_error_description')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
