import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      const data = await authApi.login(values);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error: any) {
      console.error('[Login Error]', error);
      
      let humanMessage = 'Login failed. Please try again later.';
      
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        if (error.response.status === 401) {
          humanMessage = 'Incorrect email or password. Please verify your credentials and try again.';
        } else {
          humanMessage = error.response.data?.message || 'Server returned an error. Please try again.';
        }
      } else if (error.request) {
        // The request was made but no response was received (network error, CORS, etc.)
        humanMessage = 'Network error: Unable to connect to the server. Please check your internet connection or the server status.';
      }

      toast.error(humanMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-900">Sign in to your account</h3>
        <p className="text-sm text-slate-500 mt-1">
          Use the credentials provided by the admin.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input placeholder="admin@fundsroom.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Form>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-500 text-center">
          Test Accounts:
          <br />admin@fundsroom.com | sales@fundsroom.com
          <br />warehouse@fundsroom.com | accounts@fundsroom.com
          <br />Password: password123
        </p>
      </div>
    </div>
  );
};

export default Login;
