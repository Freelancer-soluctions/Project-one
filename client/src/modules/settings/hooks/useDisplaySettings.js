import { useMemo } from 'react'
export function useDisplaySettings(settings) {
  return useMemo(() => {
    if (!settings) return {}

    const {
      displayEvents,
      displayNotes,
      displayNews,
      displayProfile,
      displayLanguage,
      displayReports,
      displayPayroll,
      displayStock
    } = settings

    return {
      displayEvents,
      displayNotes,
      displayNews,
      displayProfile,
      displayLanguage,
      displayReports,
      displayPayroll,
      displayStock
    }
  }, [settings]) // Solo se recalcula si 'settings' cambia
}
