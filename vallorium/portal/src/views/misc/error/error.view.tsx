import { useTranslation } from 'react-i18next';
import './error.view.css';

export const ErrorView = ({ error }: { error?: Error }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="c-content error_content">
        <h1 className="text-scale-2 c-welcome-title font-bold">
          {t('errors.statut')}
        </h1>
        <p className="text-scale-5 c-welcome-message">
          {t('errors.description')}
        </p>
        <br />
        <p>{error?.message || 'unknown error'}</p>
      </div>
    </>
  );
};
