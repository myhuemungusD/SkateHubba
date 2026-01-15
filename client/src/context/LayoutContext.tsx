import { createContext, useContext, type ReactNode } from "react";

interface LayoutContextValue {
  /** True when inside DashboardLayout (nav is provided by layout) */
  isDashboard: boolean;
}

const LayoutContext = createContext<LayoutContextValue>({ isDashboard: false });

export function LayoutProvider({ children, isDashboard }: { children: ReactNode; isDashboard: boolean }) {
  return (
    <LayoutContext.Provider value={{ isDashboard }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}

/**
 * Hook to determine if Navigation should be shown
 * Returns false when inside DashboardLayout
 */
export function useShowNavigation() {
  const { isDashboard } = useLayout();
  return !isDashboard;
}
