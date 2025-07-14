

https://github.com/user-attachments/assets/e6156c16-beec-4796-9bbf-5293fade3867

# Smart Roomie

**Find your perfect roommate with Smart Roomie, an intelligent platform that uses AI and sensor verification to match you with compatible roommates based on lifestyle, not just budget.**

Say goodbye to roommate roulette. Smart Roomie helps you find a living situation where you can truly thrive.

## ✨ Key Features

- **AI-Powered Onboarding**: A dynamic chat with our AI, 'Smart Roomie', builds your unique "Roommate DNA" profile based on your lifestyle preferences (cleanliness, social style, sleep schedule, etc.).
- **User-Specific Experience**: The app provides a tailored experience for both **Room Seekers** and **Listing Creators (Listers)**.
- **Local Listing Database**: Create and view listings directly in the app. All data is stored locally in your browser, no backend required!
- **Sample Listings**: The app is pre-populated with sample listings to showcase functionality right away.
- **Secure Authentication**: User sign-up and sign-in are handled securely by [Clerk](https://clerk.com/).
- **Protected Routes**: Sensitive pages like the dashboard and listing creation are only accessible to authenticated users.
- **(Simulated) Sensor Verification**: Listers can perform simulated webcam and microphone checks to build trust with potential roommates.

## 🛠️ Tech Stack

- **Frontend Framework**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [@clerk/clerk-react](https://clerk.com/docs/quickstarts/react)
- **AI Integration**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) for Google Gemini
- **Routing**: [React Router](https://reactrouter.com/)
- **State Management**: React Hooks (`useState`, `useEffect`, `useRef`)

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (or yarn/pnpm/bun)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <YOUR_GIT_URL>
    cd smart-living-match-main
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your API keys:
    ```env
    VITE_GEMINI_API_KEY=your_google_gemini_api_key
    VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

    The application will be available at `http://localhost:8080`.

## 📂 Project Structure

```
/src
├── assets		# Static assets like images
├── components		# Reusable UI components (Cards, Navigation, etc.)
│   └── ui		# shadcn/ui base components
├── pages		# Main pages for each route (Dashboard, Onboarding, etc.)
├── App.tsx		# Main application component with routing logic
├── main.tsx		# Entry point of the application
└── index.css		# Global styles and Tailwind CSS configuration
```

## 🗄️ Database Migration

This project has been migrated from Firebase Firestore to Supabase. See the [Supabase Migration Guide](./SUPABASE_MIGRATION_GUIDE.md) for detailed instructions.

### Quick Setup

1. **Set up Supabase project** at [supabase.com](https://supabase.com)
2. **Run the database migration** using `supabase-migration.sql`
3. **Update environment variables**:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Test the connection**:
   ```bash
   node scripts/test-supabase.js
   ```
5. **Migrate existing data** (if needed):
   ```bash
   node scripts/migrate-to-supabase.js
   ```

## 🔮 Future Work

- Develop the "Harmony Hub" feature.
- Expand the AI conversation to include more compatibility factors.
- Add real-time chat between matched users.
- Implement advanced analytics and reporting.
