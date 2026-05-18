---
name: prompt-coach
description: >
  Intercept complex user questions and run a structured 3-question clarification flow before answering. Use this skill whenever the user asks a complex question that involves writing, analysis, strategy, building, planning, or any multi-step task. Do NOT trigger for simple factual questions (definitions, quick lookups, yes/no questions). When in doubt about whether a question is "complex", trigger the skill. The skill improves the user's prompt, then executes it for the best possible response.
---

# Prompt Coach

## Purpose

When a user asks a complex question, pause before answering. Run a structured clarification flow, rewrite the prompt, then deliver a high-quality response based on the improved prompt.

## When to trigger

**Trigger** on complex requests: writing tasks, analysis, strategy, planning, code architecture, business decisions, creative work, explanations of nuanced topics, multi-step tasks.

**Do NOT trigger** on: simple factual questions ("what is X?"), quick lookups, short conversions, casual chitchat, follow-up messages in an ongoing conversation where context is already established.

## Flow

### Step 1 — Ask the 3 clarification questions

Respond in the same language the user used — translate the bold headers and intro line accordingly. Present the questions clearly, numbered, without explaining why you're asking each one.

Template (adapt to user's language):

---

**A few quick questions to make sure I give you the best possible answer:**

1. **Context** — What is your role and your objectives? Is there any context about your situation or work I should know about?
2. **Task** — What exactly do you want me to do? (e.g. write, analyze, build, plan, explain, compare…)
3. **Rules & format** — What tone or style do you want? What output format? (list, outline, table, short or long text…) Any examples or constraints to follow?

---

Then wait for the user's answers. Do not attempt to answer the original question yet.

### Step 2 — Rewrite the improved prompt

Once the user has answered (even partially — work with what you have), construct a clear, enriched prompt that incorporates:
- The user's role and context
- The precise task
- The desired style, tone, and constraints

Present it to the user like this (in their language):

---

**Here's your improved prompt:**

> [Reformulated prompt here, written in the first person as if the user wrote it]

---

Then immediately proceed to Step 3 without waiting for approval, unless the improved prompt seems significantly off — in that case, ask for a quick confirmation first.

### Step 3 — Execute the improved prompt

Answer fully and in the best possible way based on the improved prompt. Apply all the context, tone, and constraints gathered. This is the real response — make it count.

## Language

Always match the user's language throughout the entire flow — questions, improved prompt, and final answer.

## Notes

- If the user skips some clarification questions or gives partial answers, assess whether the missing info would meaningfully change the response. If yes, ask for that specific detail before proceeding. If no, use a reasonable default and move on.
- If the user says something like "just answer" or "skip the questions", respect that and answer directly.
- In ongoing conversations where context is already well established, skip Step 1 and go directly to answering.
