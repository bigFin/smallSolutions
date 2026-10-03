---
title: "Prismatic"
summary: "Programmable LED hardware for testing how plants respond to different light spectra."
period: "2017-2019"
order: 5
featured: false
tags:
  - photobiology
  - embedded
  - hardware
  - research
cover: "../../assets/projects/prismatic-overview.webp"
coverAlt: "Original FinMax design sheet showing the Prismatic controller board, wired light array, and tissue-culture vessel"
coverCaption: "The original Prismatic V1 / FinMax design sheet, preserved from the project repository."
links:
  - label: "GitHub"
    href: "https://github.com/bigFin/Prismatic"
  - label: "Publication"
    href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8566924/"
---

## Light as an experimental variable

I built Prismatic to study how light spectrum affects organ formation and regeneration in tissue culture. Each light module can run its own schedule, so researchers can compare conditions and then repeat an experiment.

I designed and built the system in association with the AMP Jones Lab and the Gosling Research Institute for Plant Preservation at the University of Guelph.

## Hardware and controls

The system combines modular LED drivers and arrays with C++ firmware on an ESP8266-based NodeMCU. A web interface, served directly from the microcontroller over Wi-Fi, lets a phone or computer program the lighting schedules.

I designed the circuit boards in Eagle and assembled them by hand in Guelph. The V2 project notes describe Photon: a nine-channel LED array designed to fit the WeVitro dogBox tissue-culture bioreactor.

The experimental work used a central composite rotatable design: a method for testing how several variables interact without trying every possible combination.

The GitHub page documents the design, and the linked publication describes research using the system. This is an earlier project that brought together electronics, browser-based controls, and plant experiments.
