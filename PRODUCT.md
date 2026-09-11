# Stage AI Labs Client Dashboard

## Product truth

Stage is a B2B control surface where a business configures one autonomous customer-engagement agent and connects it to the channels included in its plan. The product must feel dependable to operators who are not technical and must never imply that a channel or agent is live before the backend confirms it.

## Current account model

- One authenticated account belongs to one organization.
- An organization can invite employees with explicit roles.
- One organization can create multiple agents.
- One agent can serve Instagram, WhatsApp, Facebook Messenger, TikTok, email, Telegram, and SMS.
- The subscription controls how many channels may be connected, not which language the agent can speak.
- Multi-organization accounts are a later phase and are not represented in the current UI.

## Agent lifecycle

1. The client creates a draft and supplies business identity, operating context, optional website, optional phone, and optional PDF context.
2. Stage processes the private context and runs automatic quality and isolation checks.
3. The client connects at least one eligible channel. Instagram is the first production connector used for validation.
4. The client explicitly activates the agent.
5. Only a server-confirmed active deployment may be described as published or available 24/7.

## Safety and tenancy

- Organization identity comes from authenticated membership, never from client-provided metadata or editable JWT user metadata.
- Every customer-owned row is scoped by organization and protected with Row Level Security.
- Provider credentials and service-role keys never enter browser storage or repository files.
- Uploaded PDFs are private and retrieved only through short-lived, authorized server access.
- Client-configurable instructions cannot disable tenant isolation, confidentiality, grounding, escalation, or anti-prompt-injection rules.
- When reliable context is missing, the agent must say so or escalate instead of inventing an answer.

## Interface direction

- Mode: Operate.
- Audience: owners and invited employees, from first-time operators to experienced teams.
- Visual language: dark, sober, technical B2B with restrained indigo/violet accents and clear operational states.
- Design dials: variance 4/10, motion 3/10, density 6/10.
- Every action has a concrete state: saved, processing, needs attention, ready, activating, active, failed, or paused.
