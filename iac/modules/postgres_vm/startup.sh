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

# ---------------------------------------------------------------------------
# Vallorium PostgreSQL configuration (managed by Terraform, safe to rerun).
# Never edit these settings by hand on the VM: change them here instead.
# ---------------------------------------------------------------------------
PG_CONF_DIR=$(ls -d /etc/postgresql/*/main | sort -V | tail -n 1)

# Own settings file in conf.d/ (included by Ubuntu's default postgresql.conf,
# and loaded after it, so these values win). Overwritten on every boot.
#  - listen_addresses='*': never fail to bind if the NIC IP is not ready yet;
#    access is still restricted by pg_hba.conf and the VPC firewall.
cat > "$PG_CONF_DIR/conf.d/vallorium.conf" <<'PGCONF'
listen_addresses = '*'
ssl = on
PGCONF

# Managed block in pg_hba.conf: removed and rewritten on every boot.
HBA_FILE="$PG_CONF_DIR/pg_hba.conf"
HBA_RULE="hostssl    ${database_name}    ${database_user}    ${client_cidr}    scram-sha-256"
sed -i '/^# BEGIN vallorium-managed$/,/^# END vallorium-managed$/d' "$HBA_FILE"
# Drop the same rule if it was once added by hand outside the block
# (compared field by field, so tabs vs spaces do not matter).
awk -v db="${database_name}" -v user="${database_user}" -v cidr="${client_cidr}" \
    '!($1 == "hostssl" && $2 == db && $3 == user && $4 == cidr)' \
    "$HBA_FILE" > "$HBA_FILE.tmp"
cat "$HBA_FILE.tmp" > "$HBA_FILE"
rm -f "$HBA_FILE.tmp"
cat >> "$HBA_FILE" <<HBA
# BEGIN vallorium-managed
$HBA_RULE
# END vallorium-managed
HBA

systemctl restart postgresql
