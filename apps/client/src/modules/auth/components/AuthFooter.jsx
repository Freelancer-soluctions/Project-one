import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
export const AuthFooter = ({ link, linkMessage, authMessage }) => {
  const { t } = useTranslation();
  return (
    <div className="text-sm text-center text-gray-500 dark:text-gray-400">
      <p>
        {t(authMessage)}

        <Link
          to={link}
          className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-300"
        >
          {'  '}
          {t(linkMessage)}
        </Link>
      </p>
    </div>
  );
};
