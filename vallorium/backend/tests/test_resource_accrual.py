import unittest
from datetime import datetime, timedelta, timezone

from app.domains.resources.calculator import accrue


class AccrualTests(unittest.TestCase):
    def setUp(self):
        self.start = datetime(2026, 1, 1, tzinfo=timezone.utc)

    def test_frequent_subsecond_settlement_equals_one_settlement(self):
        amount, remainder = 0, 0
        step = timedelta(microseconds=123456)
        for i in range(10000):
            amount, remainder = accrue(
                amount,
                remainder,
                100,
                10000,
                self.start + step * i,
                self.start + step * (i + 1),
            )
        self.assertEqual(
            (amount, remainder),
            accrue(0, 0, 100, 10000, self.start, self.start + step * 10000),
        )
        self.assertGreater(amount, 0)

    def test_rate_change_preserves_remainder(self):
        middle = self.start + timedelta(seconds=10)
        state = accrue(0, 0, 100, 10000, self.start, middle)
        state = accrue(*state, 200, 10000, middle, middle + timedelta(seconds=13))
        self.assertEqual(state, (1, 0))

    def test_full_storage_discards_fraction_and_overflow(self):
        middle = self.start + timedelta(seconds=30)
        state = accrue(9, 1800000000, 100, 10, self.start, middle)
        self.assertEqual(state, (10, 0))
        # Spend one resource; previously discarded production must not reappear.
        self.assertEqual(
            accrue(9, state[1], 100, 10, middle, middle + timedelta(seconds=1)),
            (9, 100000000),
        )

    def test_backward_settlement_is_rejected(self):
        with self.assertRaises(ValueError):
            accrue(
                10, 0, 100, 10000, self.start, self.start - timedelta(microseconds=1)
            )

    def test_zero_elapsed_preserves_fraction(self):
        self.assertEqual(accrue(1, 123, 100, 10000, self.start, self.start), (1, 123))
