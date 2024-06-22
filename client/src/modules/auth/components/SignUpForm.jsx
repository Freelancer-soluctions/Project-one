import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"




const SignUpForm = () => {

    const form = useForm({ resolver: zodResolver(loginSchema) })
    const onSubmit = (data) => {
        console.log(data);
    };
    return (
        <>
            <div className="text-center">
                <h1 className="text-3xl font-bold">Welcome back</h1>
                <p className="text-gray-500 dark:text-gray-400">Enter your email and password to sign in.</p>
            </div>
            <div className="border shadow rounded-xl bg-card text-card-foreground">
                <Form {...form}>
                    <form method="post" action="" id="profile-info-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="w-full p-10 space-y-5 ">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => {
                                return (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input id="email" name="email" placeholder="m@example.com" type="email"  {...field} value={field.value ?? ''} />
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
                                            <Input id="password" name="password" placeholder="Type your password" autoComplete="current-password" type="password"  {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                        <div className="flex items-center justify-between">
                            <p>Remind me</p>
                            <Link className="text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-300">
                                Forgot password?
                            </Link>
                        </div>
                        <Button type="submit">Sign in</Button>
                    </form>
                </Form>
            </div>




            <div className="text-sm text-center text-gray-500 dark:text-gray-400">
                <p>Do not have an account?  <Link className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700 dark:text-gray-50 dark:hover:text-gray-300">
                    Register
                </Link></p>

            </div>
        </>
    )
}

export default SignUpForm