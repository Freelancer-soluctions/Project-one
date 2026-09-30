import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LuBell,
  LuUser,
  LuMoon,
  LuShield,
  LuGlobe,
  LuLayoutTemplate,
  LuPackage,
  LuWifi,
} from 'react-icons/lu';
import { Separator } from '@/components/ui/separator';
import {
  SettingsLanguage,
  SettingsDisplay,
  SettingsProduct,
  SettingsWsStatus,
} from '../components/index';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  useChangeLanguage,
  useActiveTab,
  useDisplaySettings,
  useSaveDisplaySettings,
} from '../hooks';

/** Settings tab definitions in render order. */
const SETTINGS_TABS = [
  { value: 'profile', Icon: LuUser, labelKey: 'profile' },
  { value: 'language', Icon: LuGlobe, labelKey: 'language' },
  { value: 'appearance', Icon: LuMoon, labelKey: 'appearance' },
  { value: 'notifications', Icon: LuBell, labelKey: 'notifications' },
  { value: 'display', Icon: LuLayoutTemplate, labelKey: 'display' },
  { value: 'product', Icon: LuPackage, labelKey: 'product' },
  { value: 'websocket', Icon: LuWifi, labelKey: 'ws_status_title' },
  { value: 'account', Icon: LuShield, labelKey: 'account' },
];

/** Renders the settings tab triggers. */
const renderTabsList = (t) => (
  <TabsList className="flex flex-wrap gap-5 overflow-x-auto md:flex-nowrap">
    {SETTINGS_TABS.map(({ value, Icon, labelKey }) => (
      <TabsTrigger
        key={value}
        value={value}
        className="flex items-center gap-2"
      >
        <Icon className="w-4 h-4" />
        {t(labelKey)}
      </TabsTrigger>
    ))}
  </TabsList>
);

/** Renders the active settings tab content. */
const renderTabsContent = ({
  onChangeLanguage,
  userDisplaySettings,
  onSaveDisplaySettings,
}) => (
  <>
    <TabsContent value="language" className="space-y-6">
      <SettingsLanguage onChangeLanguage={onChangeLanguage} />
    </TabsContent>
    <TabsContent value="display" className="space-y-6">
      <SettingsDisplay
        userDisplaySettings={userDisplaySettings}
        onSaveDisplaySettings={onSaveDisplaySettings}
      />
    </TabsContent>

    <TabsContent value="product" className="space-y-6">
      <SettingsProduct />
    </TabsContent>

    <TabsContent value="websocket" className="space-y-6">
      <SettingsWsStatus />
    </TabsContent>
  </>
);

export default function Settings() {
  const { t } = useTranslation();
  const { data } = useSelector(
    (state) => state.settings.dataSettings?.userSettings
  );
  //language
  const { onChangeLanguage } = useChangeLanguage();
  //display
  const { activeTab, setActiveTab } = useActiveTab('profile');
  const userDisplaySettings = useDisplaySettings(data);
  const { onSaveDisplaySettings } = useSaveDisplaySettings(data);

  return (
    // {(isLoading || isFetching || isLoadingPost) && <Spinner />}

    <div className="w-full px-4 py-10">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('settings')}</h2>
          <p className="text-muted-foreground">
            {t('settings_preferences_message')}
          </p>
        </div>
        <Separator />
        <Tabs
          defaultValue="profile"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-10"
        >
          {renderTabsList(t)}

          {renderTabsContent({
            onChangeLanguage,
            userDisplaySettings,
            onSaveDisplaySettings,
          })}
        </Tabs>
      </div>
    </div>
  );
}
