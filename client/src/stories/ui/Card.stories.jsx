import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'

export default {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered'
  }
}

const Template = args => (
  <Card {...args}>
    <CardHeader>
      <CardTitle>Card Title</CardTitle>
      <CardDescription>Short description about the card.</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Here is the content of the card.</p>
    </CardContent>
    <CardFooter>
      <button className='px-4 py-2 text-white rounded-md bg-primary'>
        Action
      </button>
    </CardFooter>
  </Card>
)

export const Default = Template.bind({})
Default.args = {}

export const WithoutFooter = Template.bind({})
WithoutFooter.args = {
  children: (
    <>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Short description about the card.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Here is the content of the card.</p>
      </CardContent>
    </>
  )
}
