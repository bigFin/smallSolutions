---
title: "MAC: Modular Agriculture Controller"
summary: "Modular environmental control system for plant production, built around instrumentation, sensor fusion, and plant-response feedback."
period: "Ongoing"
order: 2
featured: true
tags:
  - controls
  - embedded
  - HVAC
  - sensing
  - sensor-fusion
cover: "/assets/mac-controller.png"
coverAlt: "MAC controller hardware and dashboard"
links: []
---

## System Overview
Modular environmental control platform combining custom electronics, embedded firmware, and data logging.

## Architecture & Components
- **Hardware:** Custom PCB design based on ESP32-class hardware. Integrated sensing and actuation for HVAC and lighting.
- **Firmware:** Control logic and sensor fusion for environmental management.
- **Sensing:** Environmental sensors and thermal imaging for canopy temperature monitoring.
- **Observation:** InfluxDB and Grafana for telemetry and performance tracking.

## System Capabilities
- **Unified Control:** Integration of HVAC, lighting, and sensing into a single feedback loop.
- **Environmental Resilience:** Hardened hardware and firmware for continuous operation in high-humidity environments.
- **Operational Legibility:** Clear system architecture and interfaces built for long-term maintenance.
