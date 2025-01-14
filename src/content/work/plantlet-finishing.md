---
title: "Plantlet Finishing Chambers"
summary: "Custom acclimatization infrastructure that turned a fragile tissue culture program into a usable production input."
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

This system was built to move tissue cultures through the fragile transition from sterile propagation toward acclimatization with tighter process control than off-the-shelf setups usually allow.

The work combined chamber design, electronics, firmware, instrumentation, and data systems. The point was not only to create hardware, but to build a repeatable platform that could support real production decisions and turn tissue culture output into something operationally useful.

The chamber work also sat inside a broader operating role. I was involved in redesigning the tissue culture pipeline upstream, improving the quality of material entering acclimatization, and running the surrounding production operation closely enough to see where the real constraints were.

## Problem shape

Moving plant tissue cultures out of sterile propagation and into a more production-ready state is a sensitive step. Small environmental failures can destroy consistency, survival, and throughput. Generic chamber equipment does not provide much control over that transition, which makes it hard to experiment properly and hard to trust the result at scale.

Operationally, this mattered because the tissue culture program had limited practical value before this stage was stabilized. It existed as a niche remediation and experimental effort rather than as a reliable feedstock pipeline. Once acclimatization became more controllable, the output could be used to supply a much larger production facility instead of remaining a small internal side process.

Upstream quality was part of the same problem. Work on meristem tip dissection, pathogen elimination, media formulation, screening, qualification, and clean maintenance pipelines helped improve the quality of the feedstock entering acclimatization. The finishing chambers mattered because they provided the next stable step in that larger chain.

This was a good example of translational work in practice: take a biologically delicate process, instrument it properly, and build a control system that turns trial-and-error into something more disciplined.

## What I worked on

- Custom bioreactor and chamber design for aseptic finishing
- Upstream tissue culture process redesign from meristem remediation through clean maintenance
- PCB design and embedded control hardware for the system
- Environmental monitoring, logging, and dashboarding
- Process experimentation aimed at better survival and consistency
- Carrying the platform far enough that it could be used as a real production input rather than only as an internal experiment
- Running the surrounding operation closely enough to connect design choices with actual production behavior

## System evolution

The core challenge was not just building a chamber. It was building a chamber that could act as an experimental and operational platform at the same time.

That meant tightening the loop between instrumentation, environmental control, and observation. The system had to be stable enough to support production use, but also flexible enough to support experiments around acclimatization, consistency, and process improvement.

Having a bioreactor at all for the final finishing stage made it possible to run structured experiments on the transition toward photoautotrophic growth across a wide range of genotypes. Parameters such as irrigation frequency, humidity set points, and HVAC activity could be tuned against survival, productivity, and general plant health instead of being managed as a rough art.

The value came from making the process more legible. Once the environment was better controlled and better observed, it became easier to investigate what was actually driving outcomes and validate operational parameters with more confidence.

## Technical decisions

- ESP8266/C++ control hardware
- Custom PCBs rather than a collection of generic controllers
- InfluxDB and Grafana for observability and process feedback
- Linux and containerized support tooling
- Iterative validation in a production-oriented setting rather than only in a lab prototype context

The firmware needed hardening to deal reliably with Wi-Fi stack quirks and uneven connectivity in some deployment locations. On the physical side, a lot of the build quality came from pragmatic engineering rather than exotic hardware: repurposing commercially available parts into assemblable modules, using practical vessels, and avoiding manufacturing approaches that would have made the system too fragile or too expensive to deploy internally at useful volume.

The common thread was building enough system around the biology that the process could be tuned and repeated. The interesting part was not a single chamber feature; it was the combination of controls, instrumentation, experimental discipline, and enough manufacturing pragmatism to make the units deployable.

## Why it matters

This project shows the same pattern as the newer work, but in a different domain. Start with a process that is technically sensitive and poorly served by generic tools. Add instrumentation, control, and iteration until it becomes a more reliable operating system.

That is what made the project useful. It turned a fragile biological transition into something more measurable, more controllable, and more economically practical. More importantly, it helped turn a technically interesting but commercially weak tissue culture effort into a capability that could actually feed production.
