---
title: "Avenue Intelligence"
summary: "An analytics app that presents pedestrian traffic information and helps manage a fleet of devices."
period: "2023-Present"
order: 1
featured: true
tags:
  - embedded
  - analytics
  - operations
  - ML
cover: "../../assets/projects/avenue-dashboard.webp"
coverAlt: "Avenue Intelligence dashboard showing traffic totals, location comparisons, daily counts, and a deployment map, with location names masked"
coverCaption: "Avenue Intelligence’s analytics dashboard, with location names masked. Select the image to view it at full size."
links:
  - label: "Website"
    href: "https://avenueintelligence.com/"
---

I’m technical co-founder of Avenue Intelligence. The system routinely counts 4 to 5 million people a month and has counted hundreds of millions in total, with customer deployments across Canada and the US.

## The rebuild

The first version was a small team effort, built as we grew. Running it helped me understand what mattered in production. I have since rebuilt the stack myself, following experiments with different storage and analytics options.

The rebuilt platform reflects what worked best at our scale:

- ChirpStack for ingestion from the sensor fleet.
- Delta Lake on Azure Blob for storage.
- Postgres for day-to-day application transactions (OLTP).
- DuckDB for analytical queries (OLAP).

I keep ClickHouse as an experimental second backend, which I may return to if customer numbers and workloads grow. Some infrastructure still runs on AWS.

## Building and operating it

The devices are designed for low power use, long battery life, and long-range LoRa radio communication. My work spans the custom sensor hardware, firmware, data pipeline, ML layer, and web app.

I maintain the rebuilt stack in a monorepo and run it on NixOS and Kubernetes. I build and operate it as a team of one, including diagnosing failures.
