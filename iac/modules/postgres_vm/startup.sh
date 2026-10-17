#!/usr/bin/env bash
set -euxo pipefail

DEVICE="/dev/disk/by-id/google-postgres-data"
MOUNT_POINT="/var/lib/postgresql"

apt-get update
apt-get install -y e2fsprogs

# Format only a brand-new disk.
if ! blkid "$DEVICE" >/dev/null 2>&1; then
    mkfs.ext4 -F "$DEVICE"
fi

mkdir -p "$MOUNT_POINT"

UUID=$(blkid -s UUID -o value "$DEVICE")

if ! grep -q "$UUID" /etc/fstab; then
    echo "UUID=$UUID $MOUNT_POINT ext4 defaults,noatime 0 2" >> /etc/fstab
fi

mount -a

# Install PostgreSQL only after its data mount exists.
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    postgresql \
    postgresql-contrib

chown -R postgres:postgres "$MOUNT_POINT"

systemctl enable postgresql
systemctl restart postgresql
