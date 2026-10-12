# **App Name**: ChronoSim Racing Universe

## Core Features:

- User Authentication: Secure user login with Firebase Authentication.
- Entity Management (CRUD): Manage games, tracks, cars, and pilots through dedicated CRUD interfaces.
- Event Management: Create, view, and manage racing events with details and participant selection.
- Real-time Result Tracking: Log race results with timing and generate a live leaderboard.
- AI Pilot Biography Generation: Generate pilot biographies using AI, based on name, nationality and driving style using a tool that leverages the Gemini API and saves the biographies into Firestore.
- Automated Race Chronicles: Automatically generate race summaries based on the race results with a tool using AI that is triggered when new race results are saved to Firestore.
- Dashboard Overview: Display a summary of current events and latest race times on a central dashboard.

## Style Guidelines:

- Primary color: Racing red (#E63946) to evoke the thrill of racing.
- Background color: Light gray (#F1FAEE) for a clean and modern interface.
- Accent color: Electric blue (#457B9D) for interactive elements and highlights.
- Headline font: 'Space Grotesk' sans-serif for a techy feel, used for headlines.
- Body font: 'Inter' sans-serif for a clean, neutral look for body text.
- Use racing-themed icons to represent different data entities and actions.
- Use a responsive, grid-based layout for displaying race data and management interfaces.
- Subtle animations when loading race results and updating the leaderboard.