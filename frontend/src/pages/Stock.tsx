import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/api/stock.api';
import { useAuthStore } from '@/store/authStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import StockMovementDialog from '@/components/stock/StockMovementDialog';
import { format } from 'date-fns';

const Stock = () => {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stock-movements', page],
    queryFn: () => stockApi.listMovements({ page }),
  });

  const canEdit = user?.role === 'Admin' || user?.role === 'Warehouse';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Stock Movements</h2>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Record Movement
          </Button>
        )}
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Recorded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading movements...
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No stock movements recorded.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {format(new Date(movement.created_at), 'dd MMM yyyy, HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {movement.product?.name} ({movement.product?.sku})
                  </TableCell>
                  <TableCell>
                    <Badge variant={movement.movement_type === 'IN' ? 'default' : 'secondary'}>
                      {movement.movement_type}
                    </Badge>
                  </TableCell>
                  <TableCell className={movement.movement_type === 'IN' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {movement.movement_type === 'IN' ? '+' : '-'}{movement.quantity_changed}
                  </TableCell>
                  <TableCell>{movement.reason}</TableCell>
                  <TableCell>{movement.creator?.name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Showing {data?.data.length || 0} of {data?.meta.total || 0} movements
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data?.meta.totalPages || page === data?.meta.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <StockMovementDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={() => {
          setDialogOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default Stock;
