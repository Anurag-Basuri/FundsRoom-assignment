import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { customerApi } from '@/api/customer.api';
import { Customer } from '@/types/customer.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  mobile: z.string().min(10, 'Valid mobile is required'),
  email: z.string().email().optional().or(z.literal('')),
  business_name: z.string().optional().or(z.literal('')),
  gst_number: z.string().optional().or(z.literal('')),
  customer_type: z.enum(['Retail', 'Wholesale', 'Distributor']),
  status: z.enum(['Lead', 'Active', 'Inactive']),
  address: z.string().optional().or(z.literal('')),
});

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSuccess: () => void;
}

const CustomerDialog = ({ open, onOpenChange, customer, onSuccess }: CustomerDialogProps) => {
  const isEditing = !!customer;

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      business_name: '',
      gst_number: '',
      customer_type: 'Retail',
      status: 'Lead',
      address: '',
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email || '',
        business_name: customer.business_name || '',
        gst_number: customer.gst_number || '',
        customer_type: customer.customer_type,
        status: customer.status,
        address: customer.address || '',
      });
    } else {
      form.reset({
        name: '',
        mobile: '',
        email: '',
        business_name: '',
        gst_number: '',
        customer_type: 'Retail',
        status: 'Lead',
        address: '',
      });
    }
  }, [customer, form, open]);

  const onSubmit = async (values: z.infer<typeof customerSchema>) => {
    try {
      if (isEditing) {
        await customerApi.update(customer.id, values);
        toast.success('Customer updated successfully');
      } else {
        await customerApi.create(values);
        toast.success('Customer created successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile *</FormLabel>
                    <FormControl>
                      <Input placeholder="Mobile Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Wholesale">Wholesale</SelectItem>
                        <SelectItem value="Distributor">Distributor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Lead">Lead</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Full Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Save Changes' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDialog;
