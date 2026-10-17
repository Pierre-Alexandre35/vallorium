
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

# --------------------------------------------------
# Configure PostgreSQL networking
# --------------------------------------------------

# Detect the installed PostgreSQL cluster version.
PG_VERSION=$(pg_lsclusters --no-header |
    awk '$2 == "main" {print $1; exit}')

test -n "$PG_VERSION"

PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

# Detect the VM's primary private IPv4 address.
PRIVATE_IP=$(ip -4 -o addr show dev ens4 |
    awk '{split($4, address, "/"); print address[1]; exit}')

test -n "$PRIVATE_IP"

# Listen on localhost and the private VPC interface.
pg_conftool "$PG_VERSION" main set \
    listen_addresses "localhost,$PRIVATE_IP"

# Allow password-authenticated connections from the
# authorized private subnet.
HBA_RULE="host vallorium vallorium 10.20.0.0/24 scram-sha-256"

if ! grep -Fxq "$HBA_RULE" "$PG_HBA"; then
    echo "$HBA_RULE" >> "$PG_HBA"
fi

# --------------------------------------------------
# Start PostgreSQL
# --------------------------------------------------

systemctl enable postgresql
systemctl restart "postgresql@$PG_VERSION-main"

# Verify PostgreSQL is listening.
ss -lntp | grep ':5432'
