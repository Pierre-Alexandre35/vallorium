import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# make sure your models are on PYTHONPATH
from app.db.models import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# ------------------------------------------------------------------------------
# OVERRIDE the sqlalchemy.url in alembic.ini with the DATABASE_URL env var:
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("Environment variable DATABASE_URL is not set")
config.set_main_option("sqlalchemy.url", DATABASE_URL)
# ------------------------------------------------------------------------------

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# our MetaData object
target_metadata = Base.metadata

# list of system tables to ignore during autogenerate
EXCLUDED_TABLES = {
    "spatial_ref_sys",
    "topology",
    "layer",
    "geocode_settings",
    "edges",
    "faces",
    "addr",
    "place",
    "zip_lookup",
    "county_lookup",
    "state_lookup",
    "tract",
    "zcta5",
    "tabblock20",
    "loader_variables",
    "featnames",
    "zip_state_loc",
    "cousub",
    "zip_state",
    "pagc_gaz",
    "secondary_unit_lookup",
    "zip_lookup_base",
    "direction_lookup",
    "geocode_settings_default",
    "bg",
    "countysub_lookup",
    "zip_lookup_all",
    "state",
    "pagc_rules",
    "county",
    "loader_lookuptables",
    "pagc_lex",
    "loader_platform",
    "tabblock",
    "place_lookup",
    "addrfeat",
    "street_type_lookup",
}


def include_object(obj, name, type_, reflected, compare_to):
    """Skip PostGIS / system tables in autogenerate."""
    if type_ == "table" and name in EXCLUDED_TABLES:
        return False
    return True


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        include_schemas=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    cfg = config.get_section(config.config_ini_section)
    # url already set via set_main_option above
    connectable = engine_from_config(
        cfg,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
