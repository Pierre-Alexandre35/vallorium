import {
  QtmHeader,
  QtmHeaderBrand,
  QtmHeaderDivider,
  QtmHeaderMenu,
  QtmHeaderMenuLeft,
  QtmTabs,
  QtmHeaderMenuRight,
  QtmButton,
  QtmIcon,
} from '@qtm/react';

import { useTranslation } from 'react-i18next';
import { Typography } from '../typography';
import { useAuth, useUser } from 'src/hooks';
import { useNavData } from './use-nav-data';
import { NavItem } from './nav-item';

export const Header = () => {
  const { t: _t } = useTranslation();
  const t = (key: string) => _t(`common.header.${key}`);
  const { signoutRedirect } = useAuth();
  const { user } = useUser();
  const navData = useNavData();

  const username =
    user?.profile.family_name && user?.profile.given_name
      ? `${user.profile.family_name.toUpperCase()} ${user.profile.given_name}`
      : user?.profile.given_name || user?.profile.preferred_username;

  return (
    <QtmHeader classes="fixed top-0 z-10">
      <QtmHeaderBrand classes="header-logo">
        <img src="/icons/logo.svg" alt="thales logo" />
        <Typography classes="text-bluegrey-500 hidden medium:block pl-l">
          {t('app_name')}
        </Typography>
      </QtmHeaderBrand>
      <QtmHeaderDivider classes="hidden medium:block"></QtmHeaderDivider>
      <QtmHeaderMenu classes="overflow-x-clip">
        <QtmHeaderMenuLeft classes="hidden small:flex overflow-x-auto">
          <QtmTabs divider={false} fullHeight scrollHorizontally>
            {navData.map((navItemProps, i) => (
              <NavItem key={i} {...navItemProps} />
            ))}
          </QtmTabs>
        </QtmHeaderMenuLeft>
        <QtmHeaderMenuRight>
          <Typography className="text-bluegrey-500 hidden medium:block mr-m">
            {username}
          </Typography>
          <QtmButton onClick={() => void signoutRedirect()}>
            {t('button')}
          </QtmButton>
          <QtmButton variant="ghost" color="primary" classes="ml-s">
            <QtmIcon icon="notifications"></QtmIcon>
          </QtmButton>
        </QtmHeaderMenuRight>
      </QtmHeaderMenu>
    </QtmHeader>
  );
};
