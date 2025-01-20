import { TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
const SettingsProfile = () => {
  return (
    <TabsContent value='profile' className='space-y-6'>
      <Card>
        <CardContent className='p-6 space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Name</Label>
            <Input id='name' placeholder='Enter your name' />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' type='email' placeholder='Enter your email' />
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
    </TabsContent>
  )
}

export default SettingsProfile
