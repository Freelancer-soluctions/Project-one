import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { EventCalendarWidget } from './EventCalendarWidget';
import { Link, useNavigate } from 'react-router';
import { useCallback } from 'react';
import { CgNotes } from 'react-icons/cg';
import {
  LuArrowRight,
  LuNewspaper,
  LuCalendarCheck2,
  LuPackage,
  LuPackagePlus,
  LuBuilding2,
  LuWarehouse,
  LuShoppingCart,
  LuArrowLeftRight,
  LuDollarSign,
  LuUsersRound,
  LuUsers,
  LuClock,
  LuStar,
  LuUserSearch,
  LuWalletMinimal,
  LuClipboardPen,
  LuTrendingDown,
  LuFile,
  LuBackpack,
  LuClipboard,
} from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

/** Fila superior: gestión de contenido y administración básica. */
const MODULES_ROW_1 = [
  {
    to: 'users',
    titleKey: 'users',
    msgKey: 'users_card_msg',
    Icon: LuUserSearch,
  },
  {
    to: 'expenses',
    titleKey: 'expenses',
    msgKey: 'expenses_card_msg',
    Icon: LuTrendingDown,
  },
  {
    to: 'reports',
    titleKey: 'reports',
    msgKey: 'reports_card_msg',
    Icon: LuWalletMinimal,
  },
  { to: 'news', titleKey: 'news', msgKey: 'news_card_msg', Icon: LuNewspaper },
  { to: 'notes', titleKey: 'notes', msgKey: 'notes_card_msg', Icon: CgNotes },
  {
    to: 'events',
    titleKey: 'events',
    msgKey: 'events_card_msg',
    Icon: LuCalendarCheck2,
  },
];

/** Segunda fila: operaciones de negocio. */
const MODULES_ROW_2 = [
  {
    to: 'products',
    titleKey: 'products',
    msgKey: 'products_card_msg',
    Icon: LuPackage,
  },
  {
    to: 'providers',
    titleKey: 'providers',
    msgKey: 'providers_card_msg',
    Icon: LuBuilding2,
  },
  {
    to: 'warehouse',
    titleKey: 'warehouse',
    msgKey: 'warehouse_card_msg',
    Icon: LuWarehouse,
  },
  {
    to: 'stock',
    titleKey: 'stock',
    msgKey: 'stock_card_msg',
    Icon: LuPackagePlus,
  },
  {
    to: 'sales',
    titleKey: 'sales',
    msgKey: 'sales_card_msg',
    Icon: LuDollarSign,
  },
  {
    to: 'clients',
    titleKey: 'clients',
    msgKey: 'clients_card_msg',
    Icon: LuUsersRound,
  },
  {
    to: 'purchases',
    titleKey: 'purchases',
    msgKey: 'purchases_card_msg',
    Icon: LuShoppingCart,
  },
  {
    to: 'inventoryMovement',
    titleKey: 'inventoryMovement',
    msgKey: 'inventoryMovement_card_msg',
    Icon: LuArrowLeftRight,
  },
  {
    to: 'providerOrder',
    titleKey: 'provider_order',
    msgKey: 'provider_order_card_msg',
    Icon: LuClipboardPen,
  },
  {
    to: 'clientOrder',
    titleKey: 'client_order',
    msgKey: 'client_order_card_msg',
    Icon: LuClipboardPen,
  },
];

/** Tercera fila: recursos humanos. */
const MODULES_ROW_3 = [
  {
    to: 'employees',
    titleKey: 'employees',
    msgKey: 'employees_card_msg',
    Icon: LuUsers,
  },
  {
    to: 'attendance',
    titleKey: 'attendance',
    msgKey: 'attendance_card_msg',
    Icon: LuClock,
  },
  {
    to: 'payroll',
    titleKey: 'payroll',
    msgKey: 'payroll_card_msg',
    Icon: LuFile,
  },
  {
    to: 'performanceEvaluation',
    titleKey: 'performanceEvaluation',
    msgKey: 'performanceEvaluation_card_msg',
    Icon: LuStar,
  },
  {
    to: 'vacations',
    titleKey: 'vacations',
    msgKey: 'vacations_card_msg',
    Icon: LuBackpack,
  },
  {
    to: 'permission',
    titleKey: 'permission',
    msgKey: 'permission_card_msg',
    Icon: LuClipboard,
  },
];

const MODULES_GRID_CLASS =
  'grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8';
const MODULE_CARD_CLASS =
  'relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1';
const MODULE_LINK_CLASS =
  'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground';

/** Tarjeta de acceso a un módulo. */
function ModuleAccessCard({ to, titleKey, msgKey, Icon, t }) {
  return (
    <Card className={MODULE_CARD_CLASS}>
      <CardHeader className="p-6">
        <div className="flex items-center gap-4">
          <Icon className="w-8 h-8 text-zinc-800" />
          <div>
            <CardTitle className="text-xl">{t(titleKey)}</CardTitle>
            <CardDescription>{t(msgKey)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <Link to={to} className={MODULE_LINK_CLASS} prefetch={false}>
          {t('access')} <LuArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </CardContent>
    </Card>
  );
}

ModuleAccessCard.propTypes = {
  to: PropTypes.string.isRequired,
  titleKey: PropTypes.string.isRequired,
  msgKey: PropTypes.string.isRequired,
  Icon: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

/** Grid de tarjetas a partir de una definición de módulos. */
function ModuleCardGrid({ modules, t, className }) {
  return (
    <div className={cn(MODULES_GRID_CLASS, className)}>
      {modules.map(({ to, titleKey, msgKey, Icon }) => (
        <ModuleAccessCard
          key={to}
          to={to}
          titleKey={titleKey}
          msgKey={msgKey}
          Icon={Icon}
          t={t}
        />
      ))}
    </div>
  );
}

ModuleCardGrid.propTypes = {
  modules: PropTypes.array.isRequired,
  t: PropTypes.func.isRequired,
  className: PropTypes.string,
};

const CardModule = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleEventClick = useCallback(
    (eventId) => {
      navigate(`/home/events?id=${eventId}`);
    },
    [navigate]
  );

  return (
    <div className="flex flex-col xl:flex-row gap-4 mb-5">
      <div className="w-full xl:w-[300px] shrink-0">
        <EventCalendarWidget onEventClick={handleEventClick} />
      </div>
      <div className="flex-1 min-w-0">
        <ModuleCardGrid modules={MODULES_ROW_1} t={t} />
        <ModuleCardGrid modules={MODULES_ROW_2} t={t} className="mt-20" />
        <ModuleCardGrid modules={MODULES_ROW_3} t={t} className="mt-20" />
      </div>
    </div>
  );
};

export default CardModule;
