import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LuBell, LuUser, LuMoon, LuShield, LuGlobe } from 'react-icons/lu'
import { Separator } from '@/components/ui/separator'
import { SettingsLanguage } from '../components/index'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

export default function Settings() {
  const { id } = useSelector(state => state.auth.user.data.user)
  const { t } = useTranslation()

  // const user = useSelector(state => state.auth)
  return (
    <div className='container max-w-6xl py-10'>
      <div className='space-y-6'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>{t('settings')}</h2>
          <p className='text-muted-foreground'>
            {t('settings_preferences_message')}
          </p>
        </div>
        <Separator />
        <Tabs defaultValue='profile' className='space-y-10'>
          <TabsList className='flex flex-wrap gap-5 overflow-x-auto md:flex-nowrap'>
            <TabsTrigger value='profile' className='flex items-center gap-2'>
              <LuUser className='w-4 h-4' />
              {t('profile')}
            </TabsTrigger>
            <TabsTrigger value='appearance' className='flex items-center gap-2'>
              <LuMoon className='w-4 h-4' />
              {t('appearance')}
            </TabsTrigger>
            <TabsTrigger value='language' className='flex items-center gap-2'>
              <LuGlobe className='w-4 h-4' />
              {t('language')}
            </TabsTrigger>
            <TabsTrigger
              value='notifications'
              className='flex items-center gap-2'>
              <LuBell className='w-4 h-4' />
              {t('notifications')}
            </TabsTrigger>
            <TabsTrigger value='account' className='flex items-center gap-2'>
              <LuShield className='w-4 h-4' />
              {t('account')}
            </TabsTrigger>
          </TabsList>

          <SettingsLanguage userId={id} />
          {/* <TabsContent value='profile' className='space-y-6'>
            <Card>
              <CardContent className='p-6 space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Name</Label>
                  <Input id='name' placeholder='Enter your name' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='Enter your email'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='bio'>Bio</Label>
                  <Input id='bio' placeholder='Tell us about yourself' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='language'>Language</Label>
                  <Select>
                    <SelectTrigger id='language'>
                      <SelectValue placeholder='Select language' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='en'>English</SelectItem>
                      <SelectItem value='fr'>French</SelectItem>
                      <SelectItem value='de'>German</SelectItem>
                      <SelectItem value='es'>Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}

          {/* <TabsContent value='appearance' className='space-y-6'>
            <Card>
              <CardContent className='p-6 space-y-4'>
                <div className='space-y-2'>
                  <Label>Theme</Label>
                  <RadioGroup
                    defaultValue='light'
                    className='grid grid-cols-3 gap-4'>
                    <Label
                      htmlFor='light'
                      className='flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary'>
                      <RadioGroupItem
                        value='light'
                        id='light'
                        className='sr-only'
                      />
                      <LuMoon className='w-6 h-6' />
                      <span className='mt-2'>Light</span>
                    </Label>
                    <Label
                      htmlFor='dark'
                      className='flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary'>
                      <RadioGroupItem
                        value='dark'
                        id='dark'
                        className='sr-only'
                      />
                      <LuMoon className='w-6 h-6' />
                      <span className='mt-2'>Dark</span>
                    </Label>
                    <Label
                      htmlFor='system'
                      className='flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary'>
                      <RadioGroupItem
                        value='system'
                        id='system'
                        className='sr-only'
                      />
                      <LuMoon className='w-6 h-6' />
                      <span className='mt-2'>System</span>
                    </Label>
                  </RadioGroup>
                </div>
                <div className='space-y-2'>
                  <Label>Font Size</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder='Select size' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='sm'>Small</SelectItem>
                      <SelectItem value='md'>Medium</SelectItem>
                      <SelectItem value='lg'>Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}
          {/* 
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
                <div className='space-y-2'>
                  <Label>Formato de fecha</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder='Seleccionar formato' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='dd/mm/yyyy'>DD/MM/YYYY</SelectItem>
                      <SelectItem value='mm/dd/yyyy'>MM/DD/YYYY</SelectItem>
                      <SelectItem value='yyyy/mm/dd'>YYYY/MM/DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}

          {/* <TabsContent value='notifications' className='space-y-6'>
            <Card>
              <CardContent className='p-6 space-y-4'>
                <div className='flex items-center justify-between space-x-2'>
                  <Label
                    htmlFor='email-notifications'
                    className='flex flex-col space-y-1'>
                    <span>Email Notifications</span>
                    <span className='text-sm font-normal text-muted-foreground'>
                      Receive emails about your account activity.
                    </span>
                  </Label>
                  <Switch id='email-notifications' />
                </div>
                <Separator />
                <div className='flex items-center justify-between space-x-2'>
                  <Label
                    htmlFor='marketing-emails'
                    className='flex flex-col space-y-1'>
                    <span>Marketing Emails</span>
                    <span className='text-sm font-normal text-muted-foreground'>
                      Receive emails about new products, features, and more.
                    </span>
                  </Label>
                  <Switch id='marketing-emails' />
                </div>
                <Separator />
                <div className='flex items-center justify-between space-x-2'>
                  <Label
                    htmlFor='security-emails'
                    className='flex flex-col space-y-1'>
                    <span>Security Emails</span>
                    <span className='text-sm font-normal text-muted-foreground'>
                      Receive emails about your account security.
                    </span>
                  </Label>
                  <Switch id='security-emails' />
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}

          {/* <TabsContent value='account' className='space-y-6'>
            <Card>
              <CardContent className='p-6 space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='current-password'>Current Password</Label>
                  <Input id='current-password' type='password' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='new-password'>New Password</Label>
                  <Input id='new-password' type='password' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='confirm-password'>Confirm Password</Label>
                  <Input id='confirm-password' type='password' />
                </div>
                <div className='pt-4'>
                  <Button>Update Password</Button>
                </div>
                <Separator />
                <div className='space-y-2'>
                  <h3 className='text-lg font-medium'>Delete Account</h3>
                  <p className='text-sm text-muted-foreground'>
                    Permanently delete your account and all of your content.
                  </p>
                  <Button variant='destructive'>Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  )
}
