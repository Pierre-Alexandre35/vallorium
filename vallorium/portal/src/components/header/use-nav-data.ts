import { useTranslation } from 'react-i18next';
import { paths } from 'src/routes/paths';
import type { NavItemProps } from './nav-item';
import { useRoles } from 'src/hooks';

export const useNavData = () => {
  const { t: _t } = useTranslation();
  const roles = useRoles();
  const t = (key: string) => _t(`common.header.${key}`);

  const clientRoles = roles.roles?.resource_access['web-client'].roles;

  const systemsTab: NavItemProps = {
    title: t('tabs.0'), // My systems
    linkTo: paths.systems.root,
  };

  const inventoryTab: NavItemProps = {
    title: 'Parc',
    linkTo: paths.inventory.root,
  };

  if (clientRoles?.includes('admin')) {
    return [systemsTab, inventoryTab];
  } else if (clientRoles?.includes('inge_system')) {
    return [systemsTab];
  } else if (clientRoles?.includes('rtpi')) {
    return [inventoryTab];
  } else {
    return [];
  }
};
