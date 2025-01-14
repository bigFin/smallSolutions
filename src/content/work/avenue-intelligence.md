---
title: "Avenue Intelligence"
summary: "A distributed sensing and analytics platform combining ultra-low-power hardware, geospatial context, and operational decision support."
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

Avenue Intelligence starts with a pedestrian traffic sensing problem and quickly becomes a larger systems problem: how to build useful, privacy-preserving analytics around physical devices, geospatial context, sparse real-world signals, and systems that have to survive in production.

The work spans embedded hardware, communications, analytics, and operational infrastructure. A significant portion of the more recent platform and modeling work is intentionally redacted here because it is still active.

## Problem shape

The initial problem looks simple on the surface: count people without building a surveillance system. The real problem is harder. The devices need to be low-power, long-lived, and reliable in the field. The analytics need to be useful in real operating contexts rather than as a dashboard novelty. The surrounding systems have to support growth without becoming brittle.

Weak connectivity makes the problem even more interesting. Many deployments end up in areas with poor network coverage, and standing up gateway infrastructure is not always immediately feasible. That means the sensing layer, communications layer, and analytics layer all have to be designed with partial data, delayed delivery, and operational inconsistency in mind.

That combination is what makes the project worth doing. It sits at the intersection of embedded systems, geospatial analytics, and operational software, where each layer affects the others.

## What I worked on

- Designed and deployed ultra-low-power pedestrian traffic sensors
- Worked down into firmware, radio behavior, and power optimization to extend field life
- Built the analytics and operational systems behind the sensing layer
- Integrated contextual information to improve the usefulness of the resulting signals
- Continue reworking platform architecture toward more durable production behavior

## System evolution

The earlier version of the system focused on collection and reporting. The current work is shifting toward stronger signal quality and platform maturity, but many of the current implementation details are intentionally redacted here.

The current direction combines field data with contextual information to produce more useful operational signals. In low-coverage environments, that also means building ways to recover value from incomplete field data rather than simply accepting gaps.

On the platform side, the work is moving away from fragile or overly generic patterns and toward systems that are easier to reason about under real production pressure. More recent implementation details are redacted.

Some orchestration and internal platform work is also redacted, but the broader direction remains the same: replace generic patterns where needed and build closer to the actual workload.

Network architecture also has to mature. Community network coverage is useful, but not sufficient on its own, so the deployment model now supports more than one communications path where those constraints matter. AWS IoT Core is part of that story for private-network and higher-assurance deployments.

## Technical decisions

- Ultra-low-power sensing hardware with unusually long expected field life
- Deep firmware and radio work in long-lived field systems
- Migration from prototype development boards to assembled PCBs through multiple iterations, improving robustness and manufacturability
- Platform choices made according to workload shape rather than habit
- Cloud and self-hosted systems used where they create clear operational leverage
- Portions of the current stack are redacted

The PCB iterations mattered in practical ways. Better thermal behavior, power integrity, and manufacturability all improved deployment quality in the field.

The common thread is choosing systems for leverage rather than fashion. Some parts of the stack are newer because they are simply better suited to analytical workloads. Other parts stay close to proven operational patterns because durability matters more than novelty.

## Why it matters

The value of the project is not just the sensor and not just the analytics. It is the full chain: hardware, communications, data handling, analysis, and operational infrastructure working together well enough to support real decisions.

Those decisions include staffing, marketing timing, campaign effectiveness, broad site selection and valuation work, and monitoring activity at outdoor events or other field activations. That is the part of the work I find most compelling. It is not a research demo, and it is not just a data product. It is a translation problem: taking technically ambitious capabilities, adapting them to weak coverage and real operating constraints, and carrying them far enough that they become durable decision-support systems.
