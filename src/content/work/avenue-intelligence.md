---
title: "Avenue Intelligence"
summary: "Low-power pedestrian traffic sensors and the software that turns their readings into useful data."
period: "2023-Present"
order: 1
featured: true
tags:
  - embedded
  - analytics
  - operations
  - ML
cover: "../../assets/projects/avenue-dashboard.webp"
coverAlt: "Early people-counter dashboard with northbound and southbound traffic plotted over several days"
coverCaption: "An early prototype dashboard, May–June 2023. Directional counts and daily patterns made the sensor output visible."
links:
  - label: "Website"
    href: "https://avenueintelligence.com/"
---

## Counting foot traffic outside the lab

A pedestrian traffic sensor needs to work where it is installed—not just where power and connectivity are convenient. Avenue combines low-power sensing hardware with software for understanding how people move through a place.

I co-founded Avenue Intelligence. My work spans the circuit boards, firmware, and data infrastructure. Those pieces have to work together: power use affects how often a device can report, and unreliable connections affect how the readings are collected and interpreted.

## What’s involved

- Custom circuit boards designed for low power use and manufacturing.
- Firmware that manages power and radio communication when connectivity is weak.
- Multiple communication paths, including AWS IoT Core.
- Object storage, ClickHouse, and DuckDB for storing and analysing readings.
- Location and time data to put the sensor readings in context.

Processing at the device is part of the privacy approach. The system is designed for off-grid deployments and intermittent connections, with a path from prototypes to production hardware.
