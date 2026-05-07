Good research base. Let me check if anything gets closer to the exact multi-agent loop you described.Okay I have a solid picture now. Here's the honest breakdown:

---

## Does your exact idea exist? Not quite. Here's the map.

Your vision is genuinely more sophisticated than anything currently on the market. Let me break it down by layer:

### What already exists

**Debate practice with one AI opponent:**
Debate AI is an argument training assistant that analyzes debate structure, identifies logical fallacies, and provides real-time feedback on persuasive techniques, with customizable debate simulations that mimic formats like Lincoln-Douglas and parliamentary styles. That's the closest to your "adversarial AI debater" piece, but it's text-based and one AI, not a multi-agent loop.

Symbai lets you enter a debating topic, choose a side for the AI to argue, and it instantly builds a structured case. You debate their AI opponent with a toolkit and coach at hand, while it tracks performance data. More structured, designed around education, but still single-agent.

**Speech feedback in the Toastmasters mold:**
Yoodli is an AI speech coach with real-time feedback on filler words, pacing, clarity, and eye contact, trusted by 300,000+ Toastmasters members. Yoodli introduced an AI conversational roleplay mode in 2026 that simulates skeptical audiences or tough interviewers, so you can practice maintaining composure under pressure. This is the closest thing to your "Toastmasters evaluator" agent. But it's built for sales pitches and interviews, not live debate with timed rounds.

**Multi-agent debate frameworks:**
There's a Multi-Agent Debate MCP server that enables structured debates between AI personas with formal argumentation, rebuttals, and judgments across multiple rounds, with agent roles like debater and judge. This exists as a developer tool/framework, not a consumer product you can just use.

---

### What's missing from every existing tool

Your idea has a few specific mechanics that nobody has combined yet:

1. **You are inside the loop** -- not as a moderator, but as one of the debaters getting torn apart
2. **Timed response pressure** (the 1-minute clock is the whole point for training on-the-fly thinking)
3. **Multiple AI agents with distinct roles** -- adversarial debaters + passive audience + Toastmasters-style evaluator -- all running simultaneously
4. **Post-session holistic analysis** of your rhetoric arc across the whole debate, not just per-turn feedback

The closest single-product analog to this whole thing is Yoodli's roleplay mode -- but it simulates one-on-one conversations, not live multi-party adversarial debates with timed slots and an audience that votes.

---

### The verdict

The pieces exist in scattered form. What you described is essentially:

- **Yoodli** (delivery feedback) + **Debate AI** (argument analysis) + **a multi-agent orchestration layer** (the loop with adversarial + audience roles) + **a timer mechanic**

Nobody has assembled them into one product. Which also means this is a legit gap worth building. The infrastructure (Claude/GPT APIs, voice-to-text, multi-agent frameworks) is all mature enough to do it now. If you wanted to prototype it, it would be very buildable as a custom app using Claude's API -- want me to sketch a design for it?