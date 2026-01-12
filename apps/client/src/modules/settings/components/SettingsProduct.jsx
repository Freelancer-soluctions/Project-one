import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { LuTags, LuBox, LuSettings } from 'react-icons/lu'
import { SettingsProductCategories } from '@/modules/settingsProductCategories/page/SettingsProductCategories'

export function SettingsProduct() {
  const { t } = useTranslation()

  return (
    <div className='space-y-6'>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-xl'>
            <LuBox className='w-5 h-5' />
            {t('product_settings')}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Accordion type='single' collapsible className='w-full'>
            <AccordionItem
              value='categories'
              className='mb-2 border rounded-md shadow-sm border-border bg-card'>
              <AccordionTrigger className='px-4 py-4 hover:bg-accent hover:no-underline rounded-t-md'>
                <div className='flex items-center gap-2'>
                  <LuTags className='w-5 h-5' />
                  <span className='font-medium'>{t('product_categories')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className='pt-4 pb-2 px-4 max-h-[50vh] overflow-y-auto scrollbar-thin'>
                <SettingsProductCategories />
              </AccordionContent>
            </AccordionItem>

            {/* Placeholder for other product settings sections */}
            <AccordionItem
              value='inventory'
              className='mb-2 border rounded-md shadow-sm border-border bg-card'>
              <AccordionTrigger className='px-4 py-4 hover:bg-accent hover:no-underline rounded-t-md'>
                <div className='flex items-center gap-2'>
                  <LuBox className='w-5 h-5' />
                  <span className='font-medium'>
                    {t('inventory_management')}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className='py-4 text-muted-foreground'>
                  {t('inventory_management_placeholder')}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
