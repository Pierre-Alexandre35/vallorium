#!/usr/bin/env bash
set -euo pipefail

DEVICE="/dev/disk/by-id/google-postgres-data"
MOUNT_POINT="/var/lib/postgresql"

# Values injected by Terraform templatefile().
DATABASE_NAME="${database_name}"
DATABASE_USER="${database_user}"

log() {
    echo "[postgres-bootstrap] $*"
}

# -----------------------------------------------
# 1. Validate configuration
# -----------------------------------------------

for identifier in "$DATABASE_NAME" "$DATABASE_USER"; do
    if [[ ! "$identifier" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
        log "ERROR: Invalid PostgreSQL identifier."
        exit 1
    fi
done

log "Starting PostgreSQL bootstrap."

# -----------------------------------------------
# 2. Prepare persistent disk
# -----------------------------------------------

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y e2fsprogs postgresql-common

# Wait for the attached disk to appear.
for attempt in $(seq 1 30); do
    if [[ -b "$DEVICE" ]]; then
        break
    fi

    log "Waiting for data disk..."
    sleep 2
done

if [[ ! -b "$DEVICE" ]]; then
    log "ERROR: PostgreSQL data disk not found."
    exit 1
fi

# Never format a disk containing existing data.
FS_TYPE=$(blkid -s TYPE -o value "$DEVICE" 2>/dev/null || true)

if [[ -z "$FS_TYPE" ]]; then
    if [[ -n "$(wipefs -n "$DEVICE" 2>/dev/null)" ]]; then
        log "ERROR: Disk has existing signatures; refusing to format."
        exit 1
    fi

    log "Formatting new, empty PostgreSQL data disk."
    mkfs.ext4 "$DEVICE"
elif [[ "$FS_TYPE" != "ext4" ]]; then
    log "ERROR: Unexpected filesystem type: $FS_TYPE"
    exit 1
fi

# -----------------------------------------------
# 3. Mount persistent data disk
# -----------------------------------------------

mkdir -p "$MOUNT_POINT"

UUID=$(blkid -s UUID -o value "$DEVICE")

if ! grep -qF "UUID=$UUID " /etc/fstab; then
    echo "UUID=$UUID $MOUNT_POINT ext4 defaults,noatime 0 2" \
        >> /etc/fstab
fi

if ! mountpoint -q "$MOUNT_POINT"; then
    mount "$MOUNT_POINT"
fi

# Verify that PostgreSQL uses the correct disk.
MOUNT_SOURCE=$(findmnt -n -o SOURCE --target "$MOUNT_POINT")
MOUNT_UUID=$(blkid -s UUID -o value "$MOUNT_SOURCE")

if [[ "$MOUNT_UUID" != "$UUID" ]]; then
    log "ERROR: Wrong filesystem mounted at $MOUNT_POINT."
    exit 1
fi

log "Persistent data disk mounted successfully."

# -----------------------------------------------
# 4. Install PostgreSQL
# -----------------------------------------------

apt-get install -y postgresql postgresql-contrib

# Do not recursively change ownership of existing
# database files on every startup.
chown postgres:postgres "$MOUNT_POINT"

systemctl enable postgresql
systemctl restart postgresql

# -----------------------------------------------
# 5. Verify PostgreSQL readiness
# -----------------------------------------------

log "Waiting for PostgreSQL."

READY=false

for attempt in $(seq 1 30); do
    if runuser -u postgres -- pg_isready -q; then
        READY=true
        break
    fi

    sleep 2
done

if [[ "$READY" != "true" ]]; then
    log "ERROR: PostgreSQL did not become ready."
    exit 1
fi

# -----------------------------------------------
# 6. Verify data directory persistence
# -----------------------------------------------

DATA_DIR=$(runuser -u postgres -- \
    psql -X -Atqc "SHOW data_directory;")

DATA_MOUNT_UUID=$(findmnt -n -o UUID --target "$DATA_DIR")

if [[ "$DATA_MOUNT_UUID" != "$UUID" ]]; then
    log "ERROR: PostgreSQL data directory is not on the data disk."
    exit 1
fi

log "PostgreSQL data directory: $DATA_DIR"

# -----------------------------------------------
# 7. Create application role if missing
# -----------------------------------------------

ROLE_EXISTS=$(runuser -u postgres -- \
    psql -X -Atqc \
    "SELECT 1 FROM pg_roles WHERE rolname = '$DATABASE_USER';")

if [[ "$ROLE_EXISTS" != "1" ]]; then
    log "Creating PostgreSQL application role."

    runuser -u postgres -- \
        createuser --login "$DATABASE_USER"
else
    log "Application role already exists."
fi

# -----------------------------------------------
# 8. Create application database if missing
# -----------------------------------------------

DB_EXISTS=$(runuser -u postgres -- \
    psql -X -Atqc \
    "SELECT 1 FROM pg_database WHERE datname = '$DATABASE_NAME';")

if [[ "$DB_EXISTS" != "1" ]]; then
    log "Creating PostgreSQL application database."

    runuser -u postgres -- \
        createdb \
        --owner="$DATABASE_USER" \
        "$DATABASE_NAME"
else
    log "Application database already exists."
fi

# -----------------------------------------------
# 9. Finish
# -----------------------------------------------

log "PostgreSQL bootstrap completed successfully."
log "Application database: $DATABASE_NAME"
log "Application role: $DATABASE_USER"
log "Database password must be provisioned separately."
