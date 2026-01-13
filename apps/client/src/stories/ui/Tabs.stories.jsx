import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
};

export const DefaultTabs = () => (
  <Tabs defaultValue="tab1" className="w-[300px]">
    <TabsList>
      <TabsTrigger value="tab1">Tab 1</TabsTrigger>
      <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      <TabsTrigger value="tab3">Tab 3</TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">Contenido del Tab 1</TabsContent>
    <TabsContent value="tab2">Contenido del Tab 2</TabsContent>
    <TabsContent value="tab3">Contenido del Tab 3</TabsContent>
  </Tabs>
);
