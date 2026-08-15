# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Nothing yet.

### Changed

- Nothing yet.

### Deprecated

- Nothing yet.

### Removed

- Nothing yet.

### Fixed

- Nothing yet.

### Security
- Nothing yet.

---


## [0.3.0] - 2026-08-05

- Switched from JWT http-only bearer token to session cookies
- 

## [0.2.0] - 2025-08-16

### Changed

- Switched API payloads to expose `resource_type` as a human-readable string (e.g., `"WOOD"`) instead of an internal integer ID.
  This change follows best practices discussed in Mark Seemann’s blog, favoring clarity and stability in BFF-style APIs where a frontend is the primary consumer.

---

## [0.1.0] - 2025-08-15

### Added

- Initial changelog structure.
