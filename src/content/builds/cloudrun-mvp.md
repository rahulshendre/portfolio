---
title: cloudrun-mvp
summary: A minimal Go CLI that runs PipeCD's CLOUDRUN_SYNC deployment flow against a real Cloud Run service. Proof of work for a GSoC 2026 proposal, a Cloud Run plugin for PipeCD v1.
year: 2026
stack: [Go, Google Cloud Run, PipeCD]
order: 4
links:
  - { label: Source, url: "https://github.com/rahulshendre/cloudrun-mvp" }
  - { label: Proposal issue, url: "https://github.com/pipe-cd/pipecd/issues/6114" }
---
The six-step flow in `main.go` is a direct port of `ensureSync()` from the v0 PipeCD Cloud Run executor.
