"""Application metadata classifying tables by their role; creates no tables."""

TABLE_CLASSIFICATION: dict[str, frozenset[str]] = {
    "REFERENCE_MASTER": frozenset(
        {
            "resources_types",
            "tribe_attributes",
            "tribe_advantage",
            "farm_level",
            "farm_level_cost",
            "building_type",
            "building_level",
            "building_level_cost",
            "building_prerequisite",
            "granary_capacity",
            "warehouse_capacity",
            "map_tile_type",
            "map_tile_type_farm_slot",
        }
    ),
    "CORE_WORLD": frozenset(
        {
            "user",
            "map_tile",
            "village",
        }
    ),
    "CURRENT_STATE": frozenset(
        {
            "village_farm_plots",
            "village_building",
            "village_resource_storage",
        }
    ),
    "RUNTIME_TRANSACTION": frozenset(
        {
            "village_farm_upgrade",
            "village_building_upgrade",
            "idempotency_request",
        }
    ),
    "LEDGER_TRANSACTION": frozenset(
        {
            "village_resource_transaction",
            "village_resource_transaction_entry",
        }
    ),
}
