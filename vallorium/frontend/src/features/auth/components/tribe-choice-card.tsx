import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType } from "react";

import type { TribeOption } from "@/features/auth/types/auth";
import { gameTokens } from "@/theme";

interface TribeChoiceCardProps {
  tribe: TribeOption;
  selected: boolean;
  onSelect: () => void;
}

type TribeIconComponent = ComponentType<SvgIconProps>;

const TRIBE_ICONS: Record<string, TribeIconComponent> = {
  romans: AccountBalanceRoundedIcon,
  teutons: LocalFireDepartmentRoundedIcon,
  gauls: ShieldRoundedIcon,
};

function getTribeIcon(name: string): TribeIconComponent {
  return TRIBE_ICONS[name.trim().toLowerCase()] ?? ShieldRoundedIcon;
}

export function TribeChoiceCard({
  tribe,
  selected,
  onSelect,
}: TribeChoiceCardProps) {
  const TribeIcon = getTribeIcon(tribe.name);
  const advantages = [...tribe.advantages].sort(
    (left, right) => left.position - right.position,
  );

  return (
    <Card
      variant="outlined"
      sx={{
        borderWidth: selected ? 2 : 1,
        borderColor: selected
          ? gameTokens.colors.brand.forest
          : gameTokens.colors.border.default,
        bgcolor: selected
          ? gameTokens.colors.brand.forestSoft
          : gameTokens.colors.surface.paper,
        transition: [
          `border-color ${gameTokens.motion.quick}`,
          `box-shadow ${gameTokens.motion.quick}`,
          `transform ${gameTokens.motion.quick}`,
        ].join(", "),
        ...(selected && {
          boxShadow: `0 0 0 1px ${gameTokens.colors.brand.forest}`,
        }),
        "&:hover": {
          borderColor: gameTokens.colors.brand.forest,
          transform: "translateY(-1px)",
        },
      }}
    >
      <CardActionArea
        onClick={onSelect}
        aria-label={`Select ${tribe.name}`}
        aria-pressed={selected}
        sx={{
          p: 1.75,
          height: "100%",
          alignItems: "stretch",
        }}
      >
        <Stack spacing={1.25}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1.25}
          >
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{ minWidth: 0 }}
            >
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: gameTokens.radius.input,
                  color: selected
                    ? gameTokens.colors.common.white
                    : gameTokens.colors.brand.forest,
                  bgcolor: selected
                    ? gameTokens.colors.brand.forest
                    : gameTokens.colors.brand.forestSoft,
                }}
              >
                <TribeIcon fontSize="small" />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  fontWeight={gameTokens.typography.weight.bold}
                  sx={{ lineHeight: 1.2 }}
                >
                  {tribe.name}
                </Typography>

                {tribe.playstyle ? (
                  <Typography variant="caption" color="text.secondary">
                    {tribe.playstyle}
                  </Typography>
                ) : null}
              </Box>
            </Stack>

            {selected ? (
              <CheckCircleRoundedIcon color="primary" fontSize="small" />
            ) : tribe.playstyle ? (
              <Chip
                label={tribe.playstyle}
                size="small"
                variant="outlined"
                sx={{
                  flexShrink: 0,
                  fontWeight: gameTokens.typography.weight.medium,
                }}
              />
            ) : null}
          </Stack>

          {tribe.description ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.5 }}
            >
              {tribe.description}
            </Typography>
          ) : null}

          {advantages.length > 0 ? (
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              gap={0.75}
              aria-label={`${tribe.name} advantages`}
            >
              {advantages.map((advantage) => (
                <Chip
                  key={advantage.id}
                  icon={<CheckCircleRoundedIcon />}
                  label={advantage.title}
                  size="small"
                  sx={{
                    bgcolor: gameTokens.colors.surface.parchment,
                    border: `1px solid ${gameTokens.colors.border.default}`,
                    "& .MuiChip-icon": {
                      color: gameTokens.colors.brand.forest,
                    },
                  }}
                />
              ))}
            </Stack>
          ) : null}
        </Stack>
      </CardActionArea>
    </Card>
  );
}
