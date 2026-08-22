import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import {
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { useUpdateVillageName } from "@/features/villages/hooks/use-update-village-name";

type EditableVillageNameProps = {
  villageId: number;
  name: string;
};

export function EditableVillageName({
  villageId,
  name,
}: EditableVillageNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);

  const mutation = useUpdateVillageName(villageId);

  function startEditing() {
    setDraftName(name);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftName(name);
    setIsEditing(false);
  }

  function saveName() {
    const trimmedName = draftName.trim();

    if (
      trimmedName.length < 3 ||
      trimmedName.length > 40 ||
      trimmedName === name
    ) {
      return;
    }

    mutation.mutate(
      {
        name: trimmedName,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      saveName();
    }

    if (event.key === "Escape") {
      cancelEditing();
    }
  }

  if (isEditing) {
    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <TextField
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          autoFocus
          disabled={mutation.isPending}
          error={
            draftName.trim().length > 0 &&
            (draftName.trim().length < 3 || draftName.trim().length > 40)
          }
          slotProps={{
            htmlInput: {
              maxLength: 40,
              "aria-label": "Village name",
            },
          }}
        />

        <Tooltip title="Save village name">
          <span>
            <IconButton
              onClick={saveName}
              disabled={
                mutation.isPending ||
                draftName.trim().length < 3 ||
                draftName.trim().length > 40 ||
                draftName.trim() === name
              }
              aria-label="Save village name"
              size="small"
            >
              <CheckRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Cancel">
          <span>
            <IconButton
              onClick={cancelEditing}
              disabled={mutation.isPending}
              aria-label="Cancel village name edit"
              size="small"
            >
              <CloseRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    );
  }

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Typography variant="h4">{name}</Typography>

      <Tooltip title="Edit village name">
        <IconButton
          onClick={startEditing}
          aria-label="Edit village name"
          size="small"
        >
          <EditRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}