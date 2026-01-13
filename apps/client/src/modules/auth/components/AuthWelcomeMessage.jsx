import { useTranslation } from 'react-i18next';

export const AuthWelcomeMessage = ({ field_sign_message }) => {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold">{t('welcome_back')}</h1>
      <p className="text-gray-500 dark:text-gray-400">
        {t(field_sign_message)}
      </p>
    </div>
  );
};
