import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';

export function useActiveTab(defaultTab) {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || defaultTab;
  const [activeTab, setActiveTab] = useState(tabFromUrl); // Estado local para la pestaña activa

  // Actualizar el estado cuando cambie el query param
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]); // Se ejecuta cada vez que cambia `tab` en la URL

  return { activeTab, setActiveTab };
}
