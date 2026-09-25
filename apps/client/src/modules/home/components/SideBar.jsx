import { CgNotes } from 'react-icons/cg';
import {
  LuNewspaper,
  LuCalendarCheck2,
  LuHouse,
  LuSlidersHorizontal,
  LuLogOut,
  LuGlobe,
  LuUser,
  LuDollarSign,
  LuFileSpreadsheet,
  LuPackagePlus,
} from 'react-icons/lu';
import { Link, useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '@/modules/auth/slice/authSlice';
import PropTypes from 'prop-types';
import { QuickAccessButton } from '@/components/quickAccess/QuickAccess';
import { NotesSummary } from './NotesSummary';
import { StockSummary } from './StockSummary';
import { useMentionCount } from '@/hooks';

// Clases compartidas por todos los links del sidebar (una sola fuente).
const SIDEBAR_LINK_CLASS =
  'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground';

/**
 * Link estándar del sidebar con icono y etiqueta traducida.
 *
 * @param {Object} props - Props del link.
 * @param {string} props.to - Ruta destino.
 * @param {Object} props.Icon - Componente de icono (react-icons).
 * @param {string} props.label - Etiqueta ya traducida.
 * @returns {JSX.Element} Link listo para renderizar.
 */
const SideBarLink = ({ to, Icon, label }) => (
  <Link to={to} className={SIDEBAR_LINK_CLASS} prefetch={false}>
    <Icon className="w-5 h-5" />
    {label}
  </Link>
);

SideBarLink.propTypes = {
  to: PropTypes.string.isRequired,
  Icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
};

// Links que se renderizan tras "settings" cuando su ajuste está activo
// (el orden del array = orden de render, igual que en la versión inline).
const POST_SETTINGS_LINKS = [
  {
    when: 'displayEvents',
    to: 'events',
    Icon: LuCalendarCheck2,
    label: 'events',
  },
  {
    when: 'displayProfile',
    to: 'settings?tab=profile',
    Icon: LuUser,
    label: 'profile',
  },
  {
    when: 'displayLanguage',
    to: 'settings?tab=language',
    Icon: LuGlobe,
    label: 'language',
  },
  {
    when: 'displayReports',
    to: 'reports',
    Icon: LuFileSpreadsheet,
    label: 'reports',
  },
  {
    when: 'displayPayroll',
    to: 'payroll',
    Icon: LuDollarSign,
    label: 'payroll',
  },
];

const SideBar = ({ dataCountStock, displaySettings }) => {
  const { t } = useTranslation();
  const { unreadCount } = useMentionCount();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Cierra la sesión: limpia el estado de auth (y el token de
  // sessionStorage, vía el reducer) y vuelve al login.
  const handleLogout = () => {
    dispatch(logout());
    navigate('/signIn', { replace: true });
  };

  // Normaliza los ajustes una sola vez: evita opcional-encadenar en cada uso.
  const settings = displaySettings || {};

  const postSettingsLinks = POST_SETTINGS_LINKS.filter(
    ({ when }) => settings[when]
  );

  return (
    <>
      <SideBarLink to="/home" Icon={LuHouse} label={t('home')} />
      {settings.displayNews && (
        <SideBarLink to="news" Icon={LuNewspaper} label={t('news')} />
      )}

      {displaySettings?.displayNotes && (
        <>
          {unreadCount > 0 ? (
            <Link
              to={'notes'}
              state={{ scope: 'mixed', fromBadge: true }}
              className="flex items-center justify-start gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              <CgNotes className="w-5 h-5" />
              <span>{t('notes')}</span>
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {unreadCount}
              </span>
            </Link>
          ) : (
            <QuickAccessButton
              icon={CgNotes}
              label={t('notes')}
              content={NotesSummary}
              contentProps={{ scope: 'mixed' }}
              className={
                'flex items-center justify-start gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground '
              }
            />
          )}
        </>
      )}

      {displaySettings?.displayStock && (
        <QuickAccessButton
          icon={LuPackagePlus}
          label={t('stock')}
          content={StockSummary}
          contentProps={{ dataCountStock }}
          className={
            'flex items-center justify-start gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground '
          }
        />
      )}

      <SideBarLink
        to="settings"
        Icon={LuSlidersHorizontal}
        label={t('settings')}
      />

      {postSettingsLinks.map(({ to, Icon, label }) => (
        <SideBarLink key={to} to={to} Icon={Icon} label={t(label)} />
      ))}
      <button
        type="button"
        onClick={handleLogout}
        className={SIDEBAR_LINK_CLASS}
      >
        <LuLogOut className="w-5 h-5" />
        {t('logout')}
      </button>
    </>
  );
};

SideBar.propTypes = {
  dataCountStock: PropTypes.object,
  displaySettings: PropTypes.object,
};

export default SideBar;
