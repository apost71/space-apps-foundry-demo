# Demo Seed Questions

Use these during the live demo — each has a known-good answer grounded in the
NASA documents in `src/files/` (downloaded from [NTRS](https://ntrs.nasa.gov)).

| # | Question | What it demonstrates |
|---|----------|---------------------|
| 1 | What are the risks of bone fracture for astronauts on long-duration spaceflight, and why? | Grounded answer w/ citations (bone fracture risk doc) |
| 2 | How does simulated microgravity affect host-pathogen interactions? | Immune/host-pathogen answer (20180007542) |
| 3 | What tools did NASA build to study gene expression aboard the ISS? | Wetlab-2 / qPCR docs (20150018248) |
| 4 | How did the Plant Water Management experiments on the ISS work? | Multi-doc synthesis across the PWM series |
| 5 | What is the SHINE training program and why did NASA create it? | Program overview + summarization |
| 6 | Summarize what these documents say about studying muscle atrophy in space. | Cross-document synthesis |
| 7 | What reproducibility problems did NASA identify in space radiation science? | Analytical answer (20220000484) |

## Tips for the demo
- Always show that answers include **citations** rendered as 【...】 references.
- Follow up with *"which document is that from?"* to show retrieval transparency.
- Ask an off-topic question (e.g., *"What's the best pizza topping?"*) to show the
  agent refuses to hallucinate outside its grounded knowledge base.
