# AI Arena

Build a polished, responsive web app called "AI Arena" — a LeetCode-style platform where anyone can test and improve their ability to use AI effectively. This is an assessment and practice product, not a coding interview clone.

PRODUCT GOAL
Help users measure practical AI literacy and applied AI skills through realistic interactive challenges. The experience should feel premium, motivating, accessible, and credible.

DESIGN DIRECTION
Create a distinctive modern learning/competition interface inspired by high-quality developer tools: dark ink/navy background, crisp off-white surfaces for readable content, electric violet/indigo accent with restrained cyan highlights, strong typography, subtle gradients, thin borders, compact status chips, rounded cards, clear visual hierarchy. Avoid generic landing-page blobs and excessive glassmorphism. Mobile responsive. Use lucide icons. Give the product its own visual identity and logo mark.

CORE PAGES / FLOWS
1. Landing / dashboard:
- Top navigation with AI Arena logo, Explore Challenges, Leaderboard, My Progress, and Sign in / profile.
- Hero headline: "How good are you at working with AI?" with a short explanation and prominent "Take the assessment" CTA.
- Show skill domains: Prompt Engineering, Critical Evaluation, AI Tool Fluency, Workflow Design, Responsible AI, and Creative Problem Solving.
- Show stats, featured challenge cards, a scoring explanation, and sample result preview.
2. Challenge explorer:
- Search and filter by domain, difficulty (Beginner / Intermediate / Advanced), estimated time, and type.
- Cards show title, category, difficulty, time estimate, task summary, and completion state.
- Seed at least 12 meaningful challenges across all six domains.
3. Interactive challenge runner:
- Focused layout with scenario/context, task editor or suitable controls, hints, requirements/checklist, estimated time, and submit action.
- Include formats: write/improve a prompt, identify hallucinations or weak claims in an AI answer, choose best response, design an AI workflow, classify risks, and improve an output.
- Provide actual sample content and working interactions. Do not depend on an external AI API key for the initial demo. Use deterministic rubric-based scoring for demo tasks and clearly label feedback as rubric-based. Architect so an LLM evaluator can later be securely added server-side.
- On submission show score, strengths, improvement suggestions, rubric breakdown, and next recommended challenge.
4. Assessment / skill report:
- Overall AI Skill Score /100, domain breakdown, proficiency band (Beginner / Developing / Proficient / Advanced), completed challenges, time spent, and actionable recommendations.
- Use attractive charts/progress bars and a radar chart if appropriate.
5. Leaderboard:
- Demo leaderboard, explicitly labeled sample/demo data; don't imply actual live users.
- rank, alias, score, completed count.
6. Profile / progress:
- Progress history, badges, saved challenges, strengths and areas to improve.
- Use local persistence in demo mode.
7. Authentication:
- Polished sign-in/sign-up interface and guest practice. If backend auth isn't configured, guest mode must remain fully usable and explain account persistence is not connected yet.

FUNCTIONAL REQUIREMENTS
- Functional navigation and complete interactions, not static mockups.
- At least 12 challenge entries; at least 6 fully playable with meaningful rubric-based feedback and scoring.
- Onboarding: choose experience level and primary goal (career, study, productivity, creativity).
- Persist guest progress, scores, preferences, and completed challenges in localStorage with robust empty-state handling.
- Search/filter challenges and select domains.
- Transparent criteria: relevance, clarity, specificity, verification/critical thinking, safety/responsibility as applicable. Normalize to 100 and show criterion-level feedback.
- Useful initial demo state and reset-demo-data option in profile/settings.
- Accessibility: keyboard navigation, visible focus, semantic labels, contrast, responsive.
- Don't claim score is scientifically validated or a certified credential; call it an indicative practice assessment.
- Never expose API secrets or call an LLM directly from browser.

TECHNICAL
Use default stack React, TypeScript, Tailwind, shadcn/ui. Clean reusable components/types. Coherent data model for challenges, submissions, rubric scores, and user progress. Sensible error/empty/loading states. All buttons and links work. Prioritize a finished, high-quality functional front-end demo over fake backend claims.

Implement the complete experience, not just a landing page.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9d0bf8ce-609f-4115-8c0d-b9f082972a63).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
