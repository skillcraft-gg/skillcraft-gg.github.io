---
title: Introducing Skillcraft Beta
slug: introducing-skillcraft-beta
description: A new way to prove your AI coding skills
date: 2026-04-03
author: github/blairhudson
tags: [manifesto, skillcraft, credentials, ai-development, verification]
heroImage: /images/whitepaper-page-1.png
ctaText: Download the whitepaper
ctaUrl: /whitepaper/skillcraft.pdf
relatedSkills: [skillcraft-gg/hello-world, skillcraft-gg/frontend-design]
relatedCredentials: [skillcraft-gg/hello-world, skillcraft-gg/opencode-practitioner]
relatedPosts: []
---

You can build anything with AI. So how do you prove it?
One of the more important shifts AI has caused is that building things is now cheap. Cheap enough that the constraint has moved. It used to be that if you saw a working system, you could infer something about the person who built it. It took time and real effort to produce. That’s no longer true. With tools from OpenAI, Anthropic, and Google, a single developer can now produce output that looks like it came from a team; the surface area of what one person can generate has expanded quickly. But the signal hasn’t kept up.

If you look at a repository today, it’s often unclear how it came to be: Was it carefully constructed, generated and patched together, or something else entirely? You can’t tell from the output alone. That’s a problem because most ways of evaluating people still rely on output as a proxy. Resumes, portfolios, and even tests all assume that producing something implies understanding. That assumption is breaking.

Skills are now mediated by tools, and that makes them harder to observe. Skills haven’t gone away, they’ve just moved. They now show up in how someone works: how they break down problems, use AI to explore solutions, decide what is correct, and recover when it isn’t. These are patterns that unfold over time and don’t fit into a list or a single artifact. Testing doesn’t solve this because it tries to isolate a person from their tools and measure what they know, but modern development is done with tools, not without them. What you want to know is not whether someone can produce an answer in isolation, but whether they can consistently produce outcomes in real conditions.

To see that, you need a trace of how the work was done, not just the result.

⸻

Introducing Skillcraft, a new kind of evidence system. It captures that trace directly from real work. It doesn’t ask people to describe their skills or prove them in artificial settings; it records what actually happens during development. As you build, Skillcraft captures skill usage and generates proof objects tied to commits. Each commit can reference proof that describes what was done, under which skill and workflow context, and when. Because this is anchored in git, it stays local, inspectable, and reproducible. You can follow the chain yourself without relying on a separate system. This turns claims into something checkable: a claim points to commits, commits reference proof, and proof is evaluated against explicit requirements. If the evidence satisfies the policy, the claim holds; if it doesn’t, it fails. There’s no need to infer from output anymore.

The result is a different kind of signal. Instead of treating skills as static labels, Skillcraft treats them as patterns of execution. Individual skills matter less than how they are combined and applied in context. Over time, these patterns form a clearer picture of capability than any resume or portfolio.

The goal isn’t to rank people or replace judgment. It’s to make capability easier to trust by reducing how much has to be guessed. Nothing about how you work needs to change. You still build with AI, commit code, and iterate as usual. Skillcraft just turns that activity into verifiable evidence.

And that turns out to be enough.
