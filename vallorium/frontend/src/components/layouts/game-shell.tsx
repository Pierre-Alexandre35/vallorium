import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import CastleRoundedIcon from "@mui/icons-material/CastleRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { GameLogo } from "@/components/brand/game-logo";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { gameTokens } from "@/theme";

type NavItem = {
  label: string;
  icon: ReactNode;
  path: string | null;
};

const navItems: NavItem[] = [
  { label: "Village", icon: <CastleRoundedIcon fontSize="small" />, path: "/app" },
  { label: "Map", icon: <MapRoundedIcon fontSize="small" />, path: "/app/map" },
  { label: "Reports", icon: <MenuBookRoundedIcon fontSize="small" />, path: null },
  { label: "Alliance", icon: <ShieldRoundedIcon fontSize="small" />, path: null },
  { label: "Statistics", icon: <AnalyticsRoundedIcon fontSize="small" />, path: null },
];

export function GameShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const { signOut, isSigningOut } = useLogout();
  const currentUser = useCurrentUser();

  function openMobileMenu(event: MouseEvent<HTMLElement>) {
    setMenuAnchor(event.currentTarget);
  }

  function navigateFromMenu(path: string | null) {
    setMenuAnchor(null);
    if (path) navigate(path);
  }

  return (
    <Box sx={{ minHeight: "100vh", pb: 4 }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: gameTokens.colors.overlay.appBar,
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(14px)",
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: gameTokens.layout.contentMaxWidth }}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}>
            <IconButton
              sx={{ display: { md: "none" } }}
              aria-label="Open navigation"
              aria-controls={menuAnchor ? "mobile-game-navigation" : undefined}
              aria-expanded={menuAnchor ? "true" : undefined}
              onClick={openMobileMenu}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Menu
              id="mobile-game-navigation"
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              slotProps={{ paper: { sx: { minWidth: 210, mt: 1 } } }}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.label}
                  selected={item.path === location.pathname}
                  disabled={!item.path}
                  onClick={() => navigateFromMenu(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText>{item.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>

            <Box sx={{ minWidth: { md: 205 } }}>
              <GameLogo compact />
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
              sx={{ display: { xs: "none", md: "flex" }, flex: 1 }}
            >
              {navItems.map((item) => {
                const isActive = item.path === location.pathname;

                return (
                  <Button
                    key={item.label}
                    color={isActive ? "primary" : "inherit"}
                    variant={isActive ? "contained" : "text"}
                    startIcon={item.icon}
                    disabled={!item.path}
                    onClick={() => item.path && navigate(item.path)}
                    sx={{ minHeight: 38 }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
              <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
                <Typography variant="body2" fontWeight={gameTokens.typography.weight.bold}>
                  {currentUser.data?.email ?? "Player"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentUser.data?.tribe_name
                    ? `${currentUser.data.tribe_name} chief`
                    : "Village chief"}
                </Typography>
              </Box>
              <Avatar sx={{ width: 38, height: 38, bgcolor: "primary.light" }}>
                <AccountCircleRoundedIcon />
              </Avatar>
              <Tooltip title="Sign out">
                <IconButton onClick={() => signOut()} disabled={isSigningOut} aria-label="Sign out">
                  <LogoutRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      <Outlet />
    </Box>
  );
}
