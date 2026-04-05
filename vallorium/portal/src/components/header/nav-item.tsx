import { QtmTab } from '@qtm/react';
import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { RoleGuard, RoleGuardProps } from 'src/guards';
import { useActiveLink } from 'src/hooks';

export type NavItemProps = {
  title: string;
  linkTo: string;
  roles?: RoleGuardProps;
};

export const NavItem = ({ linkTo, title, roles }: NavItemProps) => {
  const active = useActiveLink(linkTo);

  const navElement = useMemo(
    () => (
      <NavLink to={linkTo}>
        <QtmTab className="h-full" active={active}>
          {title}
        </QtmTab>
      </NavLink>
    ),
    [active, linkTo, title],
  );

  if (roles) {
    return <RoleGuard {...roles}>{navElement}</RoleGuard>;
  } else {
    return navElement;
  }
};
