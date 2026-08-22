# 🚨 ResQAI — AI-Powered Disaster Response & Rescue Platform

> **From Emergency Reporting to Intelligent Response**

ResQAI is an AI-powered disaster response and rescue platform designed to improve emergency reporting, situation awareness, resource discovery, and responder coordination during disasters such as floods, earthquakes, landslides, and other emergencies.

The platform connects citizens and disaster-response administrators through a centralized web application where emergency incidents can be reported, analyzed, visualized, and prioritized.

---

## 🌐 Project Links
## links 
🚀 Live Demo:  https://resqai-aid-hub-82fe9bfa.vercel.app/
💻 GitHub:  https://github.com/priyanka12324/resqai-aid-hub-82fe9bfa
📊 Presentation: https://docs.google.com/presentation/d/1KwRv0OV7fNpJ5WsE-1ePpn28u-_wR9-j/edit?usp=drive_link&ouid=117767666886122076028&rtpof=true&sd=true
🎥 Demo Video:  https://drive.google.com/file/d/1k5Z3A0LMLzZcjqDJT4JRtP2cZpjxQlDz/view?usp=sharing

---

# 🎯 Problem Statement

During natural disasters and emergency situations, people often face difficulties in quickly reporting incidents, finding nearby emergency facilities, understanding the severity of a situation, and receiving appropriate safety guidance.

At the same time, disaster-response teams need a centralized platform to monitor incidents, identify critical situations, and prioritize emergency response.

Traditional emergency workflows can involve fragmented information and delayed communication.

### The core problem is:

> **How can technology help transform emergency information into faster, more organized, and intelligent disaster response?**

---

# 💡 Proposed Solution

ResQAI provides a unified platform that connects:

**Citizens → Emergency Reports → AI-Assisted Triage → Location Intelligence → Emergency Resources → Responders**

The platform provides tools for citizens to report disasters and access emergency resources while giving administrators a centralized interface to monitor and prioritize incidents.

---

# 🔄 Core Workflow

```text
             Disaster Occurs
                    ↓
          Citizen Reports Incident
                    ↓
            AI-Assisted Analysis
                    ↓
          Severity & Priority
                    ↓
          Incident on Emergency Map
                    ↓
       Nearby Hospitals & Shelters
                    ↓
          Recommended Safety Action
                    ↓
          Admin / Responder Monitoring
---

✨ Key Features
🚨 1. Disaster Reporting

Citizens can report emergency incidents by providing:

Disaster type
Location
Description
Number of people affected
Immediate danger status

This allows emergency information to be captured in a structured format.

🤖 2. AI-Assisted Disaster Triage

ResQAI analyzes submitted disaster reports and provides:

Severity classification
Priority assessment
Detected hazards
AI-generated analysis
Recommended safety actions

The AI triage workflow helps prioritize potentially critical incidents.

MVP Note: The current prototype uses a demo/offline analysis engine to demonstrate the AI triage workflow. It is designed to support integration with production-grade AI models in future versions.

🗺️ 3. Emergency Map

The Emergency Map provides a geographical view of emergency information.

It can display:

Disaster incidents
Disaster severity
Hospitals
Shelters
Relief facilities
Blocked roads
Emergency locations

The current prototype uses:

Leaflet
OpenStreetMap

This avoids dependency on paid Google Maps services for the prototype.

🏥 4. Find Help

Users can discover nearby emergency facilities such as:

Hospitals
Shelters
Relief camps

Facility information can include:

Location
Capacity
Availability
Facilities
Directions

This helps users identify appropriate emergency resources during a crisis.

🧠 5. AI Emergency Assistant

The AI Assistant provides safety-oriented guidance for disaster scenarios such as:

Floods
Earthquakes
Landslides
Other emergency situations

The assistant is designed to provide quick general guidance while encouraging users to follow instructions from authorized emergency authorities.

🆘 6. SOS Emergency Workflow

ResQAI provides an SOS interface for initiating an emergency alert workflow.

The current MVP demonstrates the SOS process using simulated functionality.

Important: The current prototype does not directly contact police, ambulance, fire services, or other emergency authorities.

The architecture can be extended to integrate real responder notification systems in future versions.

👨‍🚒 7. Admin Command Center

The Admin Dashboard provides a centralized operations interface for disaster-response administrators.

Administrators can monitor:

Disaster reports
Severity levels
Incident status
Emergency statistics
AI-assisted triage information

This enables responders to focus on high-priority incidents and improve emergency coordination.

🏗️ System Architecture
                         CITIZEN
                            │
                            ▼
                 ┌─────────────────────┐
                 │    RESQAI FRONTEND  │
                 │ React + TypeScript  │
                 │ TanStack Start      │
                 └──────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       ┌──────────────┐           ┌────────────────┐
       │   Supabase   │           │ Server Logic   │
       │              │           │                │
       │ Authentication│          │ AI Analysis    │
       │ PostgreSQL   │           │ Reports        │
       │ RLS          │           │ Directions     │
       │ Realtime     │           │ SOS Workflow   │
       └──────┬───────┘           └───────┬────────┘
              │                           │
              └─────────────┬─────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Emergency Data   │
                  │                  │
                  │ Reports          │
                  │ SOS Alerts       │
                  │ Facilities       │
                  │ User Roles       │
                  └────────┬─────────┘
                           │
                           ▼
                 ADMIN / RESPONDER
🛠️ Technology Stack
Frontend
React
TypeScript
TanStack Start
Tailwind CSS
Backend & Database
Supabase
PostgreSQL
Supabase Authentication
Row Level Security (RLS)
Server Functions
Realtime Database capabilities
Maps
Leaflet
OpenStreetMap
Deployment
Vercel
Development
Git
GitHub
VS Code
AI-assisted development tools
🔐 Authentication & Security

ResQAI includes authentication and role-based access functionality.

Supported roles include:

Citizen
Responder
Admin

The backend uses Supabase Authentication and database security policies to control access to protected resources.

Environment variables are used for configuration and API credentials.

Security Practices
API keys are not hard-coded
Environment variables are used for sensitive configuration
Database access is protected through Row Level Security
Role-based access is implemented for different users
🗄️ Database Structure

The platform uses a PostgreSQL database through Supabase.

Important data entities include:

profiles

Stores user profile information.

user_roles

Defines application roles such as:

Citizen
Responder
Admin
reports

Stores disaster incidents and AI-assisted triage information.

sos_alerts

Stores SOS alert information.

facilities

Stores emergency facilities such as:

Hospitals
Shelters
Relief camps

The database structure is designed to support future real-time disaster-response workflows.

📊 Prototype & Demo Data

The project includes realistic demonstration data for:

Floods
Landslides
Earthquakes
Disaster reports
Emergency alerts
Hospitals
Shelters
Relief facilities
Blocked roads

Some information is simulated because the current hackathon prototype does not rely on live government emergency data feeds.

📱 Application Modules
Module	Purpose
Dashboard	Central emergency overview
Emergency Map	Visualize incidents and emergency resources
Report Disaster	Submit emergency reports
Find Help	Locate hospitals and shelters
AI Assistant	Emergency safety guidance
SOS	Emergency alert workflow
Admin Dashboard	Incident monitoring and prioritization
🚀 Getting Started
Prerequisites

Make sure you have:

Node.js
npm
Git
Clone the Repository
git clone https://github.com/priyanka12324/resqai-aid-hub-82fe9bfa.git

Navigate to the project:

cd resqai-aid-hub-82fe9bfa

Install dependencies:

npm install
🔑 Environment Variables

Create a .env.local file in the project root.

Example:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
Important

Never commit .env.local or private API keys to GitHub.

The values above are placeholders only.

▶️ Run the Project Locally

Start the development server:

npm run dev

Open the local URL provided by the development server.

🌍 Deployment

The current application is deployed using Vercel.

Live Application

https://resqai-aid-hub-82fe9bfa.vercel.app/

The production deployment is connected to the project's GitHub repository.

🎥 Demonstration

The demonstration video showcases the complete prototype workflow:

Dashboard
     ↓
Emergency Map
     ↓
Report Disaster
     ↓
AI-Assisted Triage
     ↓
Find Help
     ↓
AI Assistant
     ↓
SOS
     ↓
Admin Command Center
Demo Video

Add your final demo video URL here.

🧪 Testing

The prototype has been tested across the major application workflows including:

Dashboard navigation
Disaster reporting
AI-assisted analysis
Emergency map visualization
Facility discovery
AI Assistant interaction
SOS workflow
Admin dashboard
Authentication flow
Production deployment

The application has also been tested in a local development environment before deployment.

🚧 Current Limitations

ResQAI is a hackathon MVP and should not be considered a live emergency-response service.

Current limitations include:

AI triage currently uses a prototype/offline analysis engine
Some emergency information is simulated
SOS is currently a simulated workflow
Live government disaster feeds are not integrated
Real responder notification systems are not connected
Production-scale emergency infrastructure has not yet been implemented

These limitations are intentional for the current prototype and provide clear directions for future development.

🚀 Future Scope

Future versions of ResQAI can include:

🤖 Advanced AI
Production-grade disaster classification
Multimodal disaster analysis
Image-based damage assessment
Predictive disaster risk analysis
📡 Real-Time Data
Government disaster feeds
Weather APIs
Earthquake monitoring
Flood-level monitoring
Real-time road closures
🆘 Emergency Communication
SMS alerts
Voice alerts
Push notifications
Real responder dispatch
Emergency organization integration
📱 Accessibility
Native Android/iOS applications
Multilingual emergency assistance
Voice-based reporting
Accessibility-focused interfaces
🛰️ Advanced Intelligence
Satellite imagery analysis
Drone-based disaster assessment
Dynamic route optimization
Emergency resource allocation
Population-risk prediction
📈 Expected Impact
For Citizens
Faster emergency reporting
Easier access to shelters and hospitals
Better awareness of nearby incidents
Quick access to emergency guidance
Improved access to emergency resources
For Responders
Centralized incident monitoring
AI-assisted prioritization
Better emergency situational awareness
Improved resource allocation
Faster decision-making
🎯 Project Vision

ResQAI aims to transform fragmented emergency information into an organized and intelligent disaster-response workflow.

The long-term vision is to create a platform where:

Emergency Information
        +
Artificial Intelligence
        +
Location Intelligence
        +
Real-Time Communication
        ↓
Faster & Better Disaster Response
⚠️ Disclaimer

ResQAI is a hackathon prototype created to demonstrate an AI-assisted disaster-response workflow.

It is not a replacement for official emergency services.

In a real emergency, users should contact the appropriate authorized emergency services and follow official emergency instructions.

👩‍💻 Project
ResQAI

AI-Powered Disaster Response & Rescue Platform

Built as a hackathon project focused on improving disaster reporting, emergency intelligence, resource discovery, and response coordination.

ResQAI — From Emergency Reporting to Intelligent Response.

📄 License

This project is developed as a hackathon prototype.


### One thing before you paste it

At the top, replace:

```text
🎥 Demo Video

Add your final demo video link here
## links 
🚀 Live Demo:  https://resqai-aid-hub-82fe9bfa.vercel.app/
💻 GitHub:  https://github.com/priyanka12324/resqai-aid-hub-82fe9bfa
📊 Presentation: https://docs.google.com/presentation/d/1KwRv0OV7fNpJ5WsE-1ePpn28u-_wR9-j/edit?usp=drive_link&ouid=117767666886122076028&rtpof=true&sd=true
🎥 Demo Video:  https://drive.google.com/file/d/1k5Z3A0LMLzZcjqDJT4JRtP2cZpjxQlDz/view?usp=sharing
## 👥 Team Members

- **Priyanka Rawat** — Team Lead / Developer
- **Member 2** — Vanshika Ahuja ,git :https/github.com/vanshikaahuja012-wq
- **Member 3** — sanskar,git: https://github.com/sanskarpadgilwar
