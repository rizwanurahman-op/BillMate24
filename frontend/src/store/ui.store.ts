import { create } from 'zustand';

interface UIState {
    isMobileMenuOpen: boolean;
    isSidebarCollapsed: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
    openMobileMenu: () => void;
    toggleSidebarCollapsed: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isMobileMenuOpen: false,
    isSidebarCollapsed: false,
    toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    closeMobileMenu: () => set({ isMobileMenuOpen: false }),
    openMobileMenu: () => set({ isMobileMenuOpen: true }),
    toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
}));
