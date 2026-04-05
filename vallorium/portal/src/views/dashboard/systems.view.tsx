import { QtmDivider } from '@qtm/react';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { Card } from 'src/components/card';
import { Typography } from 'src/components/typography';
import { NavLink } from 'react-router-dom';
import { useSystems } from './use-systems';
import { useRoles } from 'src/hooks';

export function SystemsView() {
  const { t: _t } = useTranslation();
  const systems = useSystems();

  const roles = useRoles();
  const clientRoles = roles.roles?.resource_access['web-client'].roles;

  const t = useCallback(
    (subkey: string) => _t(`dashboard.home.${subkey}`),
    [_t],
  );

  return (
    <>
      <Typography component="title-1">{t('title')}</Typography>

      <QtmDivider className="mt-s mb-l" />

      {/* Card container */}
      <div className="flex flex-wrap justify-right gap-m">
        {systems
          .filter((systemProps) => clientRoles?.includes(systemProps.id))
          .map((systemProps) => (
            <NavLink key={systemProps.id} to={systemProps.pageLinkTo}>
              <Card
                title={_t(systemProps.titleTranslation)}
                backgroundImage={systemProps.pathToCardImage} // Set the background image
              >
                {_t(systemProps.contentTranslation)}
              </Card>
            </NavLink>
          ))}
      </div>
    </>
  );
}
