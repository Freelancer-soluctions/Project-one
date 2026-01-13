import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
};

export const ScrollAreaStory = () => (
  <ScrollArea className="p-4 border h-60 w-80">
    <div className="h-[200%] w-full">Contenido largo para hacer scroll...</div>
    <ScrollBar />
  </ScrollArea>
);
