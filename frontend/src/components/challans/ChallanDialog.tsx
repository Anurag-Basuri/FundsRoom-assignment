import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { challanApi } from '@/api/challan.api';
import { customerApi } from '@/api/customer.api';
import { productApi } from '@/api/product.api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';

interface ChallanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ChallanDialog = ({ open, onOpenChange, onSuccess }: ChallanDialogProps) => {
  const [customerId, setCustomerId] = useState<string>('');
  const [items, setItems] = useState<{ product_id: string; quantity: number }[]>([
    { product_id: '', quantity: 1 }
  ]);

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list({ limit: 100 }),
    enabled: open,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productApi.list({ limit: 100 }),
    enabled: open,
  });

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) {
      return toast.error('Please select a customer');
    }

    const validItems = items.filter(item => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      return toast.error('Please add at least one valid product');
    }

    try {
      await challanApi.create({
        customer_id: customerId,
        items: validItems.map(item => ({
          product_id: item.product_id,
          quantity: Number(item.quantity)
        }))
      });
      toast.success('Draft challan created successfully');
      setCustomerId('');
      setItems([{ product_id: '', quantity: 1 }]);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create challan');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Delivery Challan</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Customer *</label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer" />
              </SelectTrigger>
              <SelectContent>
                {customersData?.data.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} {customer.business_name ? `(${customer.business_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Products *</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Select 
                      value={item.product_id} 
                      onValueChange={(val) => handleItemChange(index, 'product_id', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose product" />
                      </SelectTrigger>
                      <SelectContent>
                        {productsData?.data.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (Stock: {product.current_stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input 
                      type="number" 
                      min="1" 
                      placeholder="Qty" 
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Draft Challan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChallanDialog;
