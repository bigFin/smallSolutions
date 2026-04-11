---
title: "Plantlet Finishing Chambers"
summary: "Acclimatization infrastructure for plant tissue cultures."
period: "2021-2022"
order: 3
featured: true
tags:
  - biotech
  - automation
  - controls
  - process
cover: "/assets/plantlet-finishing.jpg"
coverAlt: "Plantlet finishing chamber"
links: []
---

## System Overview
Environmental control chambers and bioreactors for the transition of plant tissue cultures to photoautotrophic growth.

## Architecture & Components
- **Hardware:** Custom PCB design with ESP8266 control logic. Modular chamber construction.
- **Firmware:** Embedded C++ control logic for humidity, irrigation, and ventilation.
- **Sensing:** Integrated monitoring of temperature, humidity, and CO2.
- **Infrastructure:** InfluxDB and Grafana for telemetry and process validation.

## Constraints
- **Process Stability:** Hardening the transition from sterile in vitro environments to greenhouse conditions.
- **Reliability:** Engineering for 24/7 operation in high-humidity settings.
- **Scalability:** Transitioning from experimental units to production modules.
- **Validation:** Instrumentation for data-driven protocols.
