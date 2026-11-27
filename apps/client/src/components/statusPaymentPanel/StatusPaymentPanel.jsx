import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  NO_PAYMENT_METHOD,
  PAYMENT_METHOD_OPTIONS,
  getAllowedTransitions,
  paymentMethodLabelKey,
  statusBadgeVariant,
  statusLabelKey,
  transitionLabelKey,
} from '@/utils/salePurchaseStatus';

/** Payment-method select (sentinel maps back to `null` on submit). */
function PaymentMethodSelect({ value, onChange, disabled }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col flex-auto gap-2">
      <Label htmlFor="status-payment-method">{t('payment_method')}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="status-payment-method">
          <SelectValue placeholder={t('select_payment_method')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_PAYMENT_METHOD}>
            {t('payment_method_none')}
          </SelectItem>
          {PAYMENT_METHOD_OPTIONS.map((method) => (
            <SelectItem key={method} value={method}>
              {t(paymentMethodLabelKey(method))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

PaymentMethodSelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

/** Invoice-number input (server caps it at 50 chars). */
function InvoiceNumberInput({ value, onChange, disabled }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col flex-auto gap-2">
      <Label htmlFor="status-invoice-number">{t('invoice_number')}</Label>
      <Input
        id="status-invoice-number"
        name="invoiceNumber"
        maxLength={50}
        autoComplete="off"
        placeholder={t('invoice_number_placeholder')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

InvoiceNumberInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

/** Read-only `paidAt` display (stamped by the server on PAID). */
function PaidAtValue({ paidAt }) {
  const { t } = useTranslation();
  const label = paidAt ? format(new Date(paidAt), 'PPP') : t('not_paid');
  return (
    <div className="flex flex-col flex-auto gap-2">
      {/* Not a form control: a <label> would have nothing to point at. */}
      <span className="text-sm font-medium leading-none">{t('paid_at')}</span>
      <span className="flex items-center h-10 text-sm text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

PaidAtValue.propTypes = {
  paidAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

/**
 * One button per allowed transition; cancel keeps its destructive weight and
 * names the document it voids (the footer's "Close" only closes the dialog).
 */
function TransitionButtons({ kind, transitions, onTransition, disabled }) {
  const { t } = useTranslation();
  return transitions.map((target) => (
    <Button
      key={target}
      type="button"
      variant={target === 'CANCELLED' ? 'destructive' : 'success'}
      disabled={disabled}
      onClick={() => onTransition(target)}
    >
      {t(transitionLabelKey(kind, target))}
    </Button>
  ));
}

TransitionButtons.propTypes = {
  kind: PropTypes.oneOf(['sale', 'purchase']).isRequired,
  transitions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onTransition: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

/**
 * Status + payment panel shared by sales and purchases.
 *
 * Shows the current lifecycle status, lets the user edit the payment method
 * and invoice number (PATCH through the regular update endpoint) and offers
 * only the transitions the server will accept; the server still validates
 * every transition, so a stale screen cannot force an invalid move.
 *
 * @param {Object} props - Panel props.
 * @param {'sale'|'purchase'} props.kind - Document kind.
 * @param {string} props.status - Current lifecycle status.
 * @param {string|null} [props.paymentMethod] - Current payment method.
 * @param {string|null} [props.invoiceNumber] - Current invoice number.
 * @param {string|null} [props.paidAt] - Payment timestamp.
 * @param {Function} props.onTransition - Called with the target status.
 * @param {Function} props.onSavePayment - Called with `{ paymentMethod, invoiceNumber }`.
 * @param {Function} [props.onDraftChange] - Called with the normalized draft on every edit.
 * @param {boolean} [props.isSaving] - Disables the actions while a request runs.
 * @returns {JSX.Element} Panel section.
 */
export const StatusPaymentPanel = ({
  kind,
  status,
  paymentMethod,
  invoiceNumber,
  paidAt,
  onTransition,
  onSavePayment,
  onDraftChange,
  isSaving = false,
}) => {
  const { t } = useTranslation();
  // Local draft seeded from the record; remount (via `key`) when another
  // record is opened, so no effect is needed to re-sync it.
  const [draft, setDraft] = useState({
    method: paymentMethod || NO_PAYMENT_METHOD,
    invoice: invoiceNumber || '',
  });

  const transitions = getAllowedTransitions(kind, status);

  /** Normalizes the sentinel and the blank invoice before any request. */
  const toPayment = (next) => {
    const trimmedInvoice = next.invoice.trim();
    return {
      paymentMethod: next.method === NO_PAYMENT_METHOD ? null : next.method,
      invoiceNumber: trimmedInvoice === '' ? null : trimmedInvoice,
    };
  };

  // Reporting every edit lets the dialog's own Update button save the panel
  // too, instead of silently discarding it.
  const updateDraft = (partial) => {
    const next = { ...draft, ...partial };
    setDraft(next);
    onDraftChange?.(toPayment(next));
  };

  const handleSavePayment = () => {
    onSavePayment(toPayment(draft));
  };

  return (
    <section
      aria-label={t('status_payment_panel')}
      className="p-4 mt-4 border rounded-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t('status_payment_panel')}</h3>
        <Badge variant={statusBadgeVariant(status)}>
          {t(statusLabelKey(status))}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-3">
        <PaymentMethodSelect
          value={draft.method}
          onChange={(value) => updateDraft({ method: value })}
          disabled={isSaving}
        />
        <InvoiceNumberInput
          value={draft.invoice}
          onChange={(value) => updateDraft({ invoice: value })}
          disabled={isSaving}
        />
        <PaidAtValue paidAt={paidAt} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="info"
          disabled={isSaving}
          onClick={handleSavePayment}
        >
          {t('save_payment')}
        </Button>
        <TransitionButtons
          kind={kind}
          transitions={transitions}
          onTransition={onTransition}
          disabled={isSaving}
        />
      </div>
    </section>
  );
};

StatusPaymentPanel.propTypes = {
  kind: PropTypes.oneOf(['sale', 'purchase']).isRequired,
  status: PropTypes.string.isRequired,
  paymentMethod: PropTypes.string,
  invoiceNumber: PropTypes.string,
  paidAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onTransition: PropTypes.func.isRequired,
  onSavePayment: PropTypes.func.isRequired,
  onDraftChange: PropTypes.func,
  isSaving: PropTypes.bool,
};
