import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/api/stock.api';
import { productApi } from '@/api/product.api';
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

const movementSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  movement_type: z.enum(['IN', 'OUT']),
  reason: z.string().min(1, 'Reason is required'),
});

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const StockMovementDialog = ({ open, onOpenChange, onSuccess }: StockMovementDialogProps) => {
  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productApi.list({ limit: 100 }), // Fetching top 100 for simplicity
    enabled: open,
  });

  const form = useForm<z.infer<typeof movementSchema>>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      product_id: '',
      quantity: 1,
      movement_type: 'IN',
      reason: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof movementSchema>) => {
    try {
      await stockApi.createMovement(values);
      toast.success('Stock movement recorded successfully');
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record movement');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productsData?.data.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku}) - Stock: {product.current_stock}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="movement_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Movement Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IN">Stock IN (+)</SelectItem>
                        <SelectItem value="OUT">Stock OUT (-)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason / Reference *</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., New delivery, Manual adjustment" {...field} />
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
                Record Movement
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StockMovementDialog;
