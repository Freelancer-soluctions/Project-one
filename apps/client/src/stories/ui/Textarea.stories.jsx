import React from 'react';
import { Textarea } from '@/components/ui/textarea';

export default {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
};

export const DefaultTextarea = () => (
  <div className="flex flex-col space-y-4 w-96">
    <label htmlFor="default" className="text-sm font-medium">
      Texto de ejemplo
    </label>
    <Textarea id="default" placeholder="Escribe aquí..." />
  </div>
);

export const DisabledTextarea = () => (
  <div className="flex flex-col space-y-4 w-96">
    <label htmlFor="disabled" className="text-sm font-medium">
      Deshabilitado
    </label>
    <Textarea id="disabled" placeholder="No editable" disabled />
  </div>
);

export const TextareaWithDefaultValue = () => (
  <div className="flex flex-col space-y-4 w-96">
    <label htmlFor="with-value" className="text-sm font-medium">
      Con valor por defecto
    </label>
    <Textarea id="with-value" defaultValue="Este es un texto inicial..." />
  </div>
);
