---
title: "MAC: Modular Agriculture Controller"
summary: "A modular lighting and climate controller, growing out of remote-sensing research and an interest in plant biofeedback."
period: "Ongoing"
order: 2
featured: true
tags:
  - controls
  - embedded
  - HVAC
  - sensing
  - sensor-fusion
cover: "../../assets/projects/mac-telemetry.webp"
coverAlt: "Controller telemetry showing fan output, vapour pressure deficit, light output, and plant temperature over time"
coverCaption: "A control run in Grafana: fan output and vapour pressure deficit above; lighting and temperature measurements below."
links: []
---

## Starting with cameras

MAC started with cameras rather than controllers. I was exploring remote sensing with modified Nikons, Parrot cameras, and other imaging hardware. One experiment was a DIY camera conversion: removing the infrared-cut filter and adding a gel filter.

I used OpenCV and PlantCV for image analysis in plant-science work, including tissue culture. I also explored whole-plant fluorescence with a specialised lighting and photography setup.

## The biofeedback idea

That work led to a control question: could observations of the canopy become live feedback for the lighting?

The idea was to turn the light up when the plants and environmental conditions were both in a good place, and back it off when the plants were stressed. Rather than follow a fixed lighting intensity, the controller would respond to what the plants and the room were doing.

I was also curious about what a thermal sensor could contribute, particularly whether canopy temperature could be a useful input to that feedback loop.

## Reheat under LEDs

Lighting was only part of the question. With the low thermal load of LED cultivation, dehumidification could overcool the room. I was interested in reheat: deliberately adding heat back while still removing moisture.

That made heating worth considering alongside lighting, cooling, and ventilation, rather than treating it as a separate problem.

## Building MAC

I designed ESP32-based circuit boards in KiCad to connect sensors and equipment for lighting and climate control. InfluxDB records the measurements, and Grafana lets me inspect the conditions alongside the control outputs.

MAC remains an ongoing project, with plant-responsive lighting and reheat guiding the research. Operation in humid environments and long-term maintenance also shape the hardware and software.
