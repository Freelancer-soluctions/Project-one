import { useTranslation } from 'react-i18next';

/**
 * AttendeeStatus — displays user's registration status badge.
 * 
 * @param {Object} props
 * @param {string|null} props.status - CONFIRMED/WAITLIST/CANCELLED/null
 */
export const AttendeeStatus = ({ status }) => {
  const { t } = useTranslation();

  if (!status) return null;

  const styles = {
    CONFIRMED: 'bg-green-100 text-green-800',
    WAITLIST: 'bg-yellow-100 text-yellow-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const labels = {
    CONFIRMED: t('confirmed'),
    WAITLIST: t('waitlist'),
    CANCELLED: t('cancelled'),
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {labels[status] || status}
    </span>
  );
};