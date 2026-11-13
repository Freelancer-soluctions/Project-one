import { useState } from 'react';
import { useSearchParams } from 'react-router';

export function useActiveTab(defaultTab) {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || defaultTab;
  const [activeTab, setActiveTab] = useState(tabFromUrl); // Estado local para la pestaña activa

  // Sincronizar con el query param sin efecto: ajuste durante el render.
  const [syncedTabFromUrl, setSyncedTabFromUrl] = useState(tabFromUrl);
  if (tabFromUrl !== syncedTabFromUrl) {
    setSyncedTabFromUrl(tabFromUrl);
    setActiveTab(tabFromUrl);
  }

  return { activeTab, setActiveTab };
}
