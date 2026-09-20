"""Exact resource accrual; remainder units are resource-microseconds/hour."""

from datetime import datetime

UNITS_PER_HOUR = 3_600_000_000


def accrue(
    amount: int,
    remainder: int,
    rate: int,
    capacity: int,
    start: datetime,
    end: datetime,
) -> tuple[int, int]:
    if end < start:
        raise ValueError("Resource settlement cannot move game time backward")
    delta = end - start
    elapsed_us = (delta.days * 86400 + delta.seconds) * 1_000_000 + delta.microseconds
    gain, remainder = divmod(remainder + rate * elapsed_us, UNITS_PER_HOUR)
    amount += gain
    if amount >= capacity:
        return capacity, 0
    if amount < 0:
        return 0, 0
    return amount, remainder
