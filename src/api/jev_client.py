# Copyright (c) Microsoft. All rights reserved.
# Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
"""TypeSafe Jev (System One) client — fast, typed decisions around the Foundry agent.

Fail-open by design: if Jev is unreachable, misconfigured, or disabled,
`jev_available()` returns False and callers skip Jev entirely.
"""

import logging
import os
import time
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger("azureaiapp")

JEV_API_URL = os.environ.get("JEV_API_URL", "https://api.typesafe.ai/v1/systemone")
JEV_MODEL = os.environ.get("TYPESAFE_MODEL", "jev-latest")
JEV_TIMEOUT_SECONDS = float(os.environ.get("JEV_TIMEOUT_SECONDS", "8"))
JEV_CONFIDENCE_THRESHOLD = float(os.environ.get("JEV_CONFIDENCE_THRESHOLD", "0.6"))


def jev_available() -> bool:
    if os.environ.get("USE_TYPESAFE_JEV", "false").lower() != "true":
        return False
    if not os.environ.get("JEV_API_KEY"):
        logger.warning("USE_TYPESAFE_JEV is true but JEV_API_KEY is missing; disabling Jev.")
        return False
    return True


async def _ask(questions: Dict[str, Any], state: Any) -> Optional[Dict[str, Any]]:
    """One parallel evaluation of typed questions. Returns parsed answers or None."""
    payload = {"state": state, "model": JEV_MODEL, "questions": questions}
    headers = {"Authorization": f"Bearer {os.environ['JEV_API_KEY']}", "Content-Type": "application/json"}
    try:
        started = time.perf_counter()
        async with httpx.AsyncClient(timeout=JEV_TIMEOUT_SECONDS) as client:
            response = await client.post(JEV_API_URL, json=payload, headers=headers)
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        response.raise_for_status()
        data = response.json()
        data["latency_ms"] = elapsed_ms
        return data
    except Exception as e:
        logger.warning(f"Jev call failed (fail-open): {e}")
        return None


ROUTER_QUESTIONS: Dict[str, Any] = {
    "route": {
        "type": "choice",
        "instructions": "Classify this user question for a space-biology research assistant grounded in NASA life-sciences publications.",
        "criteria": {
            "answer_from_corpus": "A research question about space biology, life sciences, astronaut health, or related NASA research",
            "needs_data_not_in_corpus": "Related to space or science but unlikely covered by NASA bioscience publications",
            "off_topic": "Unrelated to space, biology, or research",
        },
    },
    "topic": {
        "type": "choice",
        "instructions": "Which NASA space-biology domain does this question concern?",
        "criteria": {
            "bone_musculoskeletal": "Bones, muscles, joints, or astronaut physical deconditioning",
            "immune_host_pathogen": "Immune system, infection, or host-pathogen interactions",
            "plants_agriculture": "Plants, crops, or life-support agriculture in space",
            "radiation": "Space radiation biology",
            "general_health": "Astronaut health, medicine, or human performance generally",
            "other": "Another life-sciences area",
        },
    },
    "is_genuine": {"type": "noul", "instructions": "Is this a genuine question rather than a test or nonsense input?"},
}


async def route_question(user_message: str) -> Optional[Dict[str, Any]]:
    """Classify the incoming question. Returns {route, topic, is_genuine, latency_ms, model} or None."""
    if not jev_available():
        return None
    data = await _ask(ROUTER_QUESTIONS, user_message)
    if not data or "answers" not in data:
        return None
    answers = data["answers"]
    return {
        "route": answers.get("route", {}).get("choice"),
        "route_probabilities": answers.get("route", {}).get("probabilities"),
        "route_confidence": answers.get("route", {}).get("confidence"),
        "topic": answers.get("topic", {}).get("choice"),
        "topic_confidence": answers.get("topic", {}).get("confidence"),
        "is_genuine": answers.get("is_genuine", {}).get("noul"),
        "latency_ms": data.get("latency_ms"),
        "model": data.get("model"),
    }


async def verify_citations(answer: str, citations: list[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    """Check each citation (label + snippet it came from) against the answer.

    citations: [{"label": filename, "passage": text}] — passages are the search
    results that fed the answer. Returns {results: [{label, supported, confidence}], latency_ms}.
    """
    if not jev_available() or not citations:
        return None
    state = {"answer": answer}
    questions: Dict[str, Any] = {}
    for i, c in enumerate(citations):
        if c.get("passage"):
            instruction = (
                "Based on the excerpt from the cited source, does the source support "
                f"the statement it is cited for? Cited source '{c['label']}': {c['passage']}"
            )
        else:
            instruction = (
                f"Without access to the document text, judge whether the statement is the kind of "
                f"claim that a NASA life-sciences publication titled '{c['label']}' would plausibly support."
            )
        questions[f"c{i}"] = {"type": "noul", "instructions": instruction}
    data = await _ask(questions, state)
    if not data or "answers" not in data:
        return None
    results = []
    for i, c in enumerate(citations):
        ans = data["answers"].get(f"c{i}", {})
        results.append(
            {
                "label": c.get("label"),
                "supported": ans.get("noul"),
                "confidence": ans.get("confidence"),
            }
        )
    return {"results": results, "latency_ms": data.get("latency_ms"), "model": data.get("model")}
