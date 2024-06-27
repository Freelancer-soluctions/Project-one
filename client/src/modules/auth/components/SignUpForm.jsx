import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../utils/schemas";
import { Link } from "react-router-dom";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import{Calendar} from '@/components/ui/calendar'
import { CalendarIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

const SignUpForm = () => {
  const form = useForm({ resolver: zodResolver(loginSchema) });
  const onSubmit = (data) => {
    console.log(data);
  };
  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Enter your email and password to sign in.
        </p>
      </div>
      <div className="border shadow rounded-xl bg-card text-card-foreground">
        <Form {...form}>
          <form
            method="post"
            action=""
            id="profile-info-form"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full p-10 space-y-5 "
          >
            <FormField
              control={form.control}
              name="fname"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input
                        id="fname"
                        name="fname"
                        placeholder="Please enter your first name."
                        type="text"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="lname"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input
                        id="lname"
                        name="lname"
                        placeholder="Please enter your last name."
                        type="text"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        name="email"
                        placeholder="m@example.com."
                        type="email"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        id="password"
                        name="password"
                        placeholder="Type your password."
                        // autoComplete="current-password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="rpassword"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        id="rpassword"
                        name="rpassword"
                        placeholder="Confirm password."
                        // autoComplete="current-password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            
            <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        " pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <FormMessage />
            </FormItem>
          )}
        />
       
            <div className="flex items-center justify-between">
              <p>Remind me</p>
              <Link className="text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-300">
                Forgot password?
              </Link>
            </div>
            <div className="flex items-center justify-center">
            <Button type="submit" className="flex-1">Sign in</Button>
            </div>
           
          </form>
        </Form>
      </div>

      <div className="text-sm text-center text-gray-500 dark:text-gray-400">
        <p>
          Do not have an account?{" "}
          <Link className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-300">
            Register
          </Link>
        </p>
      </div>
    </>
  );
};

export default SignUpForm;
