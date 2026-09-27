import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import Mock, patch

from app.db.models import UpgradeStatus
from app.domains.villages import service


class UpgradeTests(unittest.TestCase):
    def test_completion_uses_event_time_and_old_level(self):
        now = datetime(2026, 1, 1, tzinfo=timezone.utc)
        plot = SimpleNamespace(id=1, level=0)
        upgrade = SimpleNamespace(
            id=1,
            completes_at=now - timedelta(seconds=10),
            from_level=0,
            target_level=1,
            farm_plot=plot,
            status=UpgradeStatus.IN_PROGRESS,
        )
        db = Mock()

        def settle(**kwargs):
            self.assertEqual(plot.level, 0)
            self.assertEqual(kwargs["now"], upgrade.completes_at)

        with (
            patch.object(
                service.village_repo,
                "get_due_farm_upgrades_for_village",
                return_value=[upgrade],
            ),
            patch.object(
                service.resource_service,
                "settle_and_lock_village_resources",
                side_effect=settle,
            ),
        ):
            self.assertEqual(
                service._complete_due_farm_upgrades_for_locked_village(
                    db, village_id=1, now=now
                ),
                1,
            )
        self.assertEqual(plot.level, 1)
        self.assertEqual(upgrade.status, UpgradeStatus.COMPLETED)
        db.flush.assert_called_once()

    def test_empty_retry_has_no_effect(self):
        with (
            patch.object(
                service.village_repo,
                "get_due_farm_upgrades_for_village",
                return_value=[],
            ),
            patch.object(
                service.resource_service, "settle_and_lock_village_resources"
            ) as settle,
        ):
            self.assertEqual(
                service._complete_due_farm_upgrades_for_locked_village(
                    Mock(), village_id=1, now=datetime.now(timezone.utc)
                ),
                0,
            )
            settle.assert_not_called()

    def test_locked_village_is_skipped_without_processing(self):
        db = Mock()
        with (
            patch.object(
                service.village_repo,
                "get_village_ids_with_due_farm_upgrades",
                side_effect=[[1], []],
            ),
            patch.object(
                service.village_repo, "get_village_for_update", return_value=None
            ),
            patch.object(
                service, "_complete_due_farm_upgrades_for_locked_village"
            ) as complete,
        ):
            self.assertEqual(service.complete_due_farm_upgrades(db), 0)
            complete.assert_not_called()
            db.rollback.assert_called_once()

    def test_sweep_is_bounded(self):
        with (
            patch.object(
                service.village_repo,
                "get_village_ids_with_due_farm_upgrades",
                return_value=[1],
            ) as discover,
            patch.object(service.village_repo, "get_village_for_update"),
            patch.object(
                service,
                "_complete_due_farm_upgrades_for_locked_village",
                return_value=1,
            ),
        ):
            self.assertEqual(
                service.complete_due_farm_upgrades(Mock(), max_batches=2), 2
            )
            self.assertEqual(discover.call_count, 2)
