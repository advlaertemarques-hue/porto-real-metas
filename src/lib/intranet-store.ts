import { create } from 'zustand'

export type IntranetView = 'checklist' | 'processos' | 'pdi' | 'documentos' | 'institucional'

interface IntranetNavigationState {
  currentView: IntranetView
  setCurrentView: (view: IntranetView) => void
}

export const useIntranetStore = create<IntranetNavigationState>((set) => ({
  currentView: 'checklist',
  setCurrentView: (view) => set({ currentView: view }),
}))
