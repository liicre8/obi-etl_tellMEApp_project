# 🏗️ Data Platform Architecture Overview

This repository follows an extended **Medallion Architecture** pattern (Bronze → Silver → Gold) combined with **Engineering and Operational layers** to support end-to-end data processing, ML development, and deployment workflows.

---

## 🔁 Medallion Architecture Layers

| Layer               | Folder              | Description |
|---------------------|---------------------|-------------|
| 🟪 Ingestion Zone   | `01_ingestions/`    | Scripts for collecting data from external sources (APIs, websites, files, etc.). |
| 🟫 Bronze (Raw)     | `02_raw/`           | Stores unprocessed/ unaltered, raw data exactly as received. Supports audit and reprocessing. |
| 🟧 Silver (Staging) | `03_staging/`       | Cleansed and normalized data. Removes duplicates, handles missing values, standardizes schemas. |
| 🟨 Gold (Refined)   | `04_curated/`       | Business-level transformations and aggregations for analytics, KPIs, or dashboards. |
| 🎯 ML/AI Layer      | `05_models/`        | Optional folder for feature engineering or ML models built from scraped MongoDB data. |
| 📡 Serving Layer    | `06_orchestration/` | Scheduling, DAGs, and pipeline orchestration logic. |

---

## 🛠️ Engineering & Operational Layers

| Purpose                    | Folder           | Description |
|----------------------------|------------------|--------------|
| Config & Secrets Mgmt      | `07_configs/`    | Central location for config files: `.env`, YAML, JSON. Used across ingestion and transformation layers.      |
| Logs & Audit Trails        | `08_logs/`       | Auto-generated logs from pipelines or scripts. Not version-controlled.                                       |
| Testing & Validation       | `09_tests/`      | Unit and integration tests for pipeline logic, schema checks, and model validations.                         |
| Documentation              | `10_docs/`       | Internal architecture documentation, data dictionaries, flow diagrams, and usage guides.                     |
| Custom Tools & Utilities   | `11_tools/`      | Shared helper libraries or internal tools (e.g., schema validation, retry wrappers, transformation helpers). |

---

## 📦 Folder Tree Overview

| Folder              |                         Description                                                   |
|-------------------- |---------------------------------------------------------------------------------------|
| `00_infrastructure/`| # Infra setup (cloud resources, Terraform, IaC,etc.)                                  |
| `01_ingestions/`    | # External data fetching (APIs, scrapers, etc.)                                       |
| `02_raw/`           | # Raw storage zon or unaltered data (Bronze)                                          |
| `03_staging/`       | # Data cleaning and normalization (Silver)                                            |
| `04_curated/`       | # Aggregated, analytics-ready data (Gold)                                             |
| `05_models/`        | # For ML/feature scripts using scraped data (e.g., churn model, recommender).         |
| `06_orchestration/` | # Workflow orchestration (Airflow, Prefect, etc.)                                     |
| `07_configs/`       | # Environment and pipeline configs                                                    |
| `08_logs/`          | # Runtime logs (excluded from version control)                                        |
| `09_tests/`         | # Unit and integration tests                                                          |
| `10_docs/`          | # Internal documentation                                                              |
| `11_tools/`         | # Reusable helper modules                                                             |
| `README/`           | # Main project guide                                                                  |
---
