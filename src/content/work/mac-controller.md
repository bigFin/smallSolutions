---
title: "MAC: Modular Agriculture Controller"
summary: "A modular environmental control system for plant production, built around instrumentation, sensor fusion, and plant-response feedback."
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

MAC is a modular agriculture controller built around the idea that environmental control gets better once sensing, actuation, and operator feedback are treated as one system.

The platform combines custom electronics, environmental control logic, and data logging with a bias toward repeatable operation. It is intended for real plant production environments rather than purely demonstrative prototypes.

## Problem shape

Environmental control systems are often split into separate layers: controllers, dashboards, sensors, and operator decisions that only partially inform each other. That makes it hard to tune around plant response rather than around generic setpoints.

The useful problem here was to keep the control loop closer to the biology. HVAC, lighting, sensing, and observation needed to live in one system that could support both tuning and reliable day-to-day operation.

## What I worked on

- HVAC and lighting controls driven by instrumented feedback
- Custom PCB design and embedded firmware on ESP32-class hardware
- Data logging and dashboarding for tuning and troubleshooting
- A control surface that stays understandable after handoff
- Plant-response work including real-time canopy segmentation from thermal imaging

## System value

The point was not only to automate environmental equipment. It was to build a system that could expose the interaction between control decisions and plant response quickly enough to support better operating choices.

That made the controller useful both as a control platform and as an experimental tool. Instead of treating cultivation parameters as fixed recipes, the system could support iterative tuning around feedback from the plants and the environment.

## Technical decisions

- ESP32 firmware and custom PCBs rather than generic off-the-shelf control hardware
- Integrated sensing, control logic, and logging in one operational loop
- InfluxDB and Grafana for observation, tuning, and troubleshooting
- Embedded architecture designed to stay legible after handoff

The common thread was to reduce the distance between what the plants were doing, what the system was measuring, and what the operator could change.

## Why it matters

This project sits between embedded systems, controls, and production operations. It shows the same broader pattern as the rest of the site: make the system observable, close the loop, and use instrumentation to turn rough intuition into something more disciplined.
