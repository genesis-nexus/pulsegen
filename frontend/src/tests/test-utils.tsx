import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialize i18n for tests
const i18nInstance = i18n.createInstance();
i18nInstance.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'survey', 'auth'],
  defaultNS: 'common',
  resources: {
    en: {
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        submit: 'Submit',
        next: 'Next',
        previous: 'Previous',
        confirm: 'Confirm',
      },
      survey: {
        'respondent.complete': 'complete',
        'respondent.questionProgress': 'Question {{current}} of {{total}}',
        'respondent.pageProgress': 'Page {{current}} of {{total}}',
      },
      auth: {
        login: 'Login',
        logout: 'Logout',
        register: 'Register',
        email: 'Email',
        password: 'Password',
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

// Create a test query client with sensible defaults
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Props for the AllProviders component
interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  initialEntries?: string[];
}

// All providers wrapper for tests
export function AllProviders({
  children,
  queryClient = createTestQueryClient(),
  initialEntries = ['/'],
}: AllProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18nInstance}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

// Provider with BrowserRouter (for tests that need actual browser behavior)
export function BrowserProviders({
  children,
  queryClient = createTestQueryClient(),
}: Omit<AllProvidersProps, 'initialEntries'>) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18nInstance}>
        <BrowserRouter>{children}</BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

// Extended render options
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: string[];
  route?: string;
}

// Custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialEntries = ['/'],
    route,
    ...renderOptions
  }: ExtendedRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders queryClient={queryClient} initialEntries={route ? [route] : initialEntries}>
      {children}
    </AllProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Setup user event for interactive tests
export function setupUser() {
  return userEvent.setup();
}

// Render with route params
export function renderWithRoute(
  ui: ReactElement,
  {
    path = '/',
    route = '/',
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: ExtendedRenderOptions & { path?: string } = {}
): RenderResult & { queryClient: QueryClient } {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18nInstance}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={children} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Helper to setup authenticated state
export function setupAuthenticatedUser(user = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'MANAGER',
}) {
  localStorage.setItem('accessToken', 'mock-access-token');
  localStorage.setItem('refreshToken', 'mock-refresh-token');
  return user;
}

// Helper to clear auth state
export function clearAuthState() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// Helper to wait for loading to finish
export async function waitForLoadingToFinish() {
  await waitFor(
    () => {
      const loaders = document.querySelectorAll('[data-testid="loading"]');
      if (loaders.length > 0) {
        throw new Error('Still loading');
      }
    },
    { timeout: 5000 }
  );
}

// Helper to create a mock file
export function createMockFile(
  name = 'test.csv',
  type = 'text/csv',
  content = 'col1,col2\nval1,val2'
): File {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

// Helper to create mock form data
export function createMockFormData(data: Record<string, string | Blob>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { userEvent };

// Named exports for convenience
export { renderWithProviders as render };
export { i18nInstance as i18n };
