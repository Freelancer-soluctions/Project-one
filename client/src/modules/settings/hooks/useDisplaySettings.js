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
      displayPayroll
    } = settings

    return {
      displayEvents,
      displayNotes,
      displayNews,
      displayProfile,
      displayLanguage,
      displayReports,
      displayPayroll
    }
  }, [settings]) // Solo se recalcula si 'settings' cambia
}
