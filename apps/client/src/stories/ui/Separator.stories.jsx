import React from 'react';
import { Separator } from '@/components/ui/separator';

export default {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
};

export const DefaultSeparator = () => (
  <div className="flex flex-col items-center space-y-4">
    <div>Contenido arriba</div>
    <Separator className="my-2" />
    <div>Contenido abajo</div>
  </div>
);
