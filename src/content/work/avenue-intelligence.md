---
title: "Avenue Intelligence"
summary: "Distributed sensing and analytics platform combining low-power hardware, geospatial context, and decision support."
period: "2023-Present"
order: 1
featured: true
tags:
  - embedded
  - analytics
  - operations
  - ML
links:
  - label: "Website"
    href: "https://avenueintelligence.com/"
---

## System Overview
Pedestrian traffic sensing platform built for privacy-preserving analytics and weak connectivity environments.

## Architecture & Components
- **Hardware:** Low-power sensing devices. Custom PCB design for power integrity and manufacturability.
- **Firmware:** Power management and radio behavior tuned for sparse signal environments.
- **Communications:** Multi-path deployment model including AWS IoT Core.
- **Data Infrastructure:** Object-storage architecture utilizing ClickHouse and DuckDB for analytical workloads.
- **Analytics:** Integration of geospatial and spatiotemporal data for signal reliability.

## System Capabilities
- **Off-grid Autonomy:** Engineered for remote operation without local power infrastructure.
- **Network Resilience:** Data consistency across weak or intermittent communication paths.
- **Privacy by Design:** Localized edge processing to preserve signal privacy.
- **Production Scale:** Designed for stable transition from prototype to production deployment.
