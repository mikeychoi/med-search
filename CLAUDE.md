MedSearch — Project Instructions

1. Project Overview

    MedSearch is a lightweight medication search and list management web application being developed as a software engineering take-home assessment. It will not be used in an actual robust user environment, it is simply for testing purposes.

    Here are the base requirements for the application:
        - Implement a user interface for medication search
        - Integrate with an API that provides medication information (we will be using RxNorm API)
        - Implement medication search functionality that allows users to search for medications by name or other - relevant criteria.
        - Display search results with medication details, such as dosage, indications, side effects, etc.
        - Apply appropriate error handling and display relevant messages in case of API errors or search failures.
        - Ensure a responsive design that works well on different devices and screen sizes.
        - Allow users to add medications to a prescription list or remove medications from the list.
        - Provide a user-friendly interface for managing prescriptions.​​


2. Technology Stack

    Use the following technologies:

        - React: UI development and component-based architecture
        - TypeScript: Static typing for Medication, API response and List types
        - Vite: Development server build, and unit/integration testing with Vitest
        - MUI (Material UI): UI components and styling
        - RxNorm API: Medication search and medication information
        - openFDA API: potential supplementary drug labeling information (maybe)
        - localStorage: Client-side persistence of medication lists in lieu of backend
        - React Testing Library: Component testing
        - ESLint: Code linting
        - GitHub Actions: Automated CI workflow

Do not introduce additional dependencies without first explaining why they are necessary.

The application does not require a backend or database for its current scope.


3. Architecture

Follow a modular architecture that separates UI components, application logic, external services, and data types

    ```text
    src/
    ├── components/
    │   ├── SearchBar/
    │   ├── MedicationCard/
    │   ├── MedicationDetails/
    │   └── ListItem/
    ├── pages/
    │   ├── SearchPage/
    │   └── ListsPage/
    ├── services/
    │   ├── rxnorm.ts
    │   └── storage.ts
    ├── hooks/
    │   ├── useMedicationSearch.ts
    │   └── useMedicationLists.ts
    ├── types/
    │   └── medication.ts
    ├── App.tsx
    └── main.tsx
    ```

More files will probably need to be created as the application grows, but do not add any unnecessaary files prematurely

    - Components: Holds the reusable UI elements
    - Pages: Compose components into a full screen
    - Services: Handle external API requests and localStorage operations. This is mainly to separate communication with external systems from the UI components
    - Hooks: Manage React state and coordinate application logic
    - Types: Define TypeScript interfaces and types

Data Management

    - Use a normalized internal medication model rather than passing raw API responses throughout the application
    - Keep RxNorm and openFDA response types separate from internal application types
    - Handle optional and missing API fields
    - Use React state and custom hooks for application state
    - Use localStorage for persistent medication list data


4. Coding Conventions

    - Avoid duplicating code logic across repo, design elements should be sorted into nested React components
    - MUI elements should be used whenever possible with a simple standardized theme (font, color, sizing)
    - Check to ensure that imported elements are not deprecated and are up to par with the current standard


5. API Integration Guidelines

    RxNorm
        - Use RxNorm for medication searching and standardized medication concepts.
        - Preserve RxCUIs where available to identify medication concepts.
        - Handle multiple matching results and different formulations.
        - Validate API responses before using them.

    openFDA (will update if necessary)

    General API Rules
        - Handle unsuccessful HTTP responses with exceptions and error messages
        - Handle network failures and malformed responses
        - Keep API request and response transformation logic in service files
        - Avoid unnecessary API requests


6. Error Handling

    The application should handle:
        - Failed API requests
        - Network connectivity issues
        - No search results
        - Missing medication information
        - Unexpected API response structures
        - Invalid or unavailable localStorage data
        - Duplicate medications
        - Empty medication lists
        - Duplicate list names

    Use appropriate UI feedback:
        - Loading indicators for ongoing requests
        - Empty states when no results exist
        - Snackbar/alert notifications for ordinary errors and operation feedback
        - Dialogues for important confirmations or decisions (like deleting a list)
        - User-friendly error messages without revealing technical details


7. Testing Guidelines

    - Write tests for important application behavior
    - Test service functions independently of React components
    - Mock external API requests in automated tests
    - Test loading, success, empty, and error states
    - Test medication list creation, renaming, deletion, and persistence
    - Test adding and removing medications
    - Test duplicate prevention
    - Test any reasonable edge cases that may occur


8. AI-Assisted Development Guidelines

Claude Code should act as a technical assistant, not an autonomous developer

- Propose an implementation plan for significant changes
- Explain which files will be created or modified, and wait for approval
- Work incrementally without going ahead of what is requested
- Avoid modifying unrelated files
- Do not introduce unnecessary dependencies
- Do not commit or push changes without explicit approval


Follow this process for each development milestone:

1. Explore the existing implementation.
2. Understand the requested task.
3. Propose a plan.
4. Explain relevant architectural decisions.
5. Implement the approved changes.
6. Run relevant tests and checks.
7. Review the changes.
8. Summarize what was accomplished.

Do not automatically proceed to the next milestone after completing a task. Wait for the developer's next instructions.


9. Security

- Never hardcode API keys, credentials, or secrets.
- Do not store secrets in Vite environment variables prefixed with `VITE_`.