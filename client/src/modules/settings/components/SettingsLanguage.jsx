import { TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export const SettingsLanguage = () => {
  return (
    <TabsContent value='language' className='space-y-6'>
      <Card>
        <CardContent className='p-6 space-y-4'>
          <div className='space-y-2'>
            <Label>Idioma de la aplicación</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder='Seleccionar idioma' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='es'>Español</SelectItem>
                <SelectItem value='en'>English</SelectItem>
                <SelectItem value='fr'>Français</SelectItem>
                <SelectItem value='de'>Deutsch</SelectItem>
                <SelectItem value='it'>Italiano</SelectItem>
                <SelectItem value='pt'>Português</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-sm text-muted-foreground'>
              El cambio de idioma se aplicará a toda la aplicación
            </p>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}
