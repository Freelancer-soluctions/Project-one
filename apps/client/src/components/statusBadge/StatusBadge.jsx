import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Badge } from '@/components/ui/badge';
import { statusBadgeVariant, statusLabelKey } from '@/utils/salePurchaseStatus';

/**
 * Lifecycle status rendered as a semantic badge.
 *
 * @param {Object} props - Badge props.
 * @param {string} [props.status] - Raw status value; empty renders nothing.
 * @returns {JSX.Element|null} Status badge or `null` for legacy rows.
 */
export const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  return status ? (
    <Badge variant={statusBadgeVariant(status)}>
      {t(statusLabelKey(status))}
    </Badge>
  ) : null;
};

StatusBadge.propTypes = {
  status: PropTypes.string,
};
