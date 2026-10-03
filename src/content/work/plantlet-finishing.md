---
title: "Plantlet Finishing Chambers"
summary: "Controlled environments that help tissue-cultured plants make the transition from lab to greenhouse."
period: "2021-2022"
order: 3
featured: true
tags:
  - biotech
  - automation
  - controls
  - process
cover: "../../assets/projects/plantlet-chambers.webp"
coverAlt: "Clear plantlet finishing chambers on a wire rack, with fans, tubing, and control hardware attached"
coverCaption: "The chamber build: plantlets, ventilation, tubing, and control hardware together on the production rack."
gallery:
  - src: "../../assets/projects/plantlet-room.webp"
    alt: "A room with rows of clear plant chambers on benches beneath strip lighting"
    caption: "The wider setup, with chambers arranged on benches under lights."
  - src: "../../assets/projects/plantlet-roots.webp"
    alt: "Side view through a clear chamber showing plantlets held in propagation plugs"
    caption: "Plantlets in propagation plugs inside the chamber."
links: []
---

## From tissue culture to greenhouse

Plants grown in tissue culture have to adjust to life outside a sterile container. These chambers control that transition, helping plantlets move towards growth supported by photosynthesis.

The work brings plant science and embedded controls together. Humidity, irrigation, and ventilation need to be controllable, but the conditions also need to be recorded so a successful process can be repeated.

## Inside the chambers

- Custom circuit boards designed in KiCad, with ESP8266 controllers and C++ firmware.
- Controls for humidity, irrigation, and ventilation.
- Temperature, humidity, and CO₂ monitoring.
- InfluxDB and Grafana, running in Docker on Linux, for recording and reviewing conditions.

The modular design supports both individual research chambers and larger production setups. The aim is to make acclimatization a repeatable part of production, rather than a separate experiment each time.
