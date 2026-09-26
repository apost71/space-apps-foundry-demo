# 🧬 Space Apps × AI Foundry — Space Biology Knowledge Engine Demo

A working reference implementation of the [NASA Space Apps Challenge 2025](https://www.spaceappschallenge.org/2025/challenges/)
challenge **"Build a Space Biology Knowledge Engine"**, built on **Azure AI Foundry**.

> **This is a showcase project**: it exists to show future NASA Space Apps
> hackathon participants how Azure AI Foundry can power their project — a
> fully-working demo, not a competition entry.

## What you get in 15 minutes (`azd up`)

| Feature | Azure AI Foundry capability |
|---|---|
| Research assistant that answers space-biology questions | **Foundry Agent Service** (prompt agent + Azure AI Search tool) |
| Answers grounded in real NASA publications, with citations | **Azure AI Search** (hybrid + semantic + vector retrieval, auto-indexing) |
| GPT model powering the agent | **Foundry model deployments** (gpt-5-mini by default, configurable) |
| Web chat UI with conversation history & citations | Deployed to **Azure Container Apps** |
| Built-in continuous safety evaluation | **Foundry Evaluations** (violence-content evaluator wired up by default) |
| Observability / tracing (optional) | **Application Insights** + OpenTelemetry GenAI capture |

## Architecture

```
 ┌─────────────────────────┐
 │ NASA publications (NTRS)│──▶ scripts/download_nasa_docs.py ──▶ src/files/
 └─────────────────────────┘                                            │
                                                                        ▼ (auto on first start)
                                              Azure Blob Storage ─▶ Azure AI Search
                                            (documents container)   index + skillset + indexers
                                                                        │
                          ┌─────────────────────────────────────────────┘
                          ▼
              Foundry Agent Service  ◀── model deployment (gpt-5-mini)
                          │
                          ▼
              FastAPI + React chat app on Azure Container Apps
```

## Quickstart

```bash
# 1. Prereqs: az CLI, azd, python3, gh — then log in
az login && azd auth login

# 2. (Optional) refresh the NASA document corpus
python3 scripts/download_nasa_docs.py 20

# 3. Deploy everything
azd up
# When prompted: pick a subscription, region (East US 2 / Sweden Central are
# safe), and an environment name. Set USE_AZURE_AI_SEARCH_SERVICE=true when
# asked so the search resources get provisioned.

# 4. Open the endpoint printed by azd and try questions from
#    docs/seed_questions.md
```

Tear everything down when done:

```bash
azd down --purge
```

## Repo layout (vs. upstream template)

This repo is a fork of [`Azure-Samples/get-started-with-ai-agents`](https://github.com/Azure-Samples/get-started-with-ai-agents).
Changes:

- `src/files/` — replaced sample product docs with **20 real NASA bioscience
  publications** downloaded from [NTRS](https://ntrs.nasa.gov)
- `scripts/download_nasa_docs.py` — fetches the NASA corpus
- `src/gunicorn.conf.py` — agent re-persona'd as the *Space Biology Knowledge Engine*
- `docs/seed_questions.md` — demo script with known-good questions
- Upstream docs in [`docs/`](./docs) (deployment, local dev, troubleshooting) still apply

## Costs & cleanup

Running this costs roughly $10–50/month if left up (mostly AI Search *Basic* tier
+ Container Apps). For a one-day demo it's a few dollars. Always clean up with
`azd down --purge` when finished showcasing.

## License

MIT (inherited from upstream Microsoft sample).
