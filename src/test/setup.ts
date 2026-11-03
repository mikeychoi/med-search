// Adds DOM matchers such as toBeInTheDocument() to Vitest's expect.
// React Testing Library unmounts rendered trees after each test automatically
// because Vitest globals are enabled.
import '@testing-library/jest-dom/vitest';
