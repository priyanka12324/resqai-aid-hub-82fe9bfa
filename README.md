# ResQAI Dashboard

Build a modern hackathon prototype called ResQAI — AI-Powered Disaster Response & Rescue Platform.

Goal:
Create a polished emergency-response web application that helps people during floods, earthquakes, landslides, and other disasters.

Target users:

Citizens/victims

Disaster-response administrators

Core prototype flow:
Disaster occurs → citizen submits report → AI analyzes the report → severity is assigned → affected location appears on map → nearby shelters/hospitals are shown → citizen receives recommended action → SOS can be triggered.

Tech stack:

React

TypeScript

Tailwind CSS

Node.js/Express if backend is required

MongoDB if database integration is required

Use modular components

Use environment variables for API keys

Do NOT hard-code API keys

Important:
This is a hackathon prototype, not a production emergency system. Use clearly labeled demo/simulated data where real-time government data is unavailable.

Design:

Professional emergency-management dashboard

Mobile responsive

Clean modern UI

Emergency-focused visual hierarchy

Map-centered interface

Clear severity indicators

Smooth animations, but don't overuse them

Use cards, badges, alerts and status indicators

Make it look like a real disaster-management platform rather than a generic AI dashboard

Main navigation:

Dashboard

Emergency Map

Report Disaster

Find Help

AI Assistant

SOS

Admin Dashboard

Create reusable components for:

Header

Sidebar

Emergency alert

Disaster report card

Severity badge

Shelter card

Hospital card

Map markers

SOS button

AI chat window

Statistics cards

Loading states

Error states

Empty states

Create realistic demo data for:

Floods

Landslides

Earthquakes

Shelters

Hospitals

Blocked roads

Disaster reports

Emergency alerts

Do not build unnecessary features before the core user flow works.

First create the project structure and the main Dashboard UI. Do not implement external APIs yet.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3058b1de-35b6-4e11-b609-2b17598ee267).

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
