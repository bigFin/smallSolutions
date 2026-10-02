---
title: "MAC: Modular Agriculture Controller"
summary: "A modular controller for lighting, climate, and sensing, with feedback from the plants themselves."
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

## Climate control with plant feedback

Room conditions don’t tell the whole story of what a plant is experiencing. MAC brings environmental measurements and canopy temperature into the same control system as lighting, heating, ventilation, and air conditioning.

## The build

Custom ESP32-based circuit boards connect sensors and equipment. The firmware combines readings to guide environmental control, while thermal imaging adds a view of plant canopy temperature.

InfluxDB stores the measurements and Grafana makes them available to inspect. That gives the controls a useful companion: a record of what the environment was doing and how the system responded.

This is an ongoing project, with continuous operation in humid environments and long-term maintenance shaping the hardware and software.
