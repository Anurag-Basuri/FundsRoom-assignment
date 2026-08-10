import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { challanApi } from '@/api/challan.api';
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
import { Input } from '@/components/ui/input';
import { Plus, Search, FileDown, CheckCircle, XCircle } from 'lucide-react';
import ChallanDialog from '@/components/challans/ChallanDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Challans = () => {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['challans', page, search],
    queryFn: () => challanApi.list({ page, search }),
  });

  const canEdit = user?.role === 'Admin' || user?.role === 'Sales';

  const handleConfirm = async (id: string) => {
    if (confirm('Are you sure you want to confirm this challan? This will deduct stock.')) {
      try {
        await challanApi.confirm(id);
        toast.success('Challan confirmed successfully');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to confirm challan');
      }
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this challan?')) {
      try {
        await challanApi.cancel(id);
        toast.success('Challan cancelled successfully');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to cancel challan');
      }
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await challanApi.downloadInvoice(id);
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Delivery Challans</h2>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Challan
          </Button>
        )}
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Challan No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total Items</TableHead>
              <TableHead>Amount (₹)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading challans...
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No challans found.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((challan) => (
                <TableRow key={challan.id}>
                  <TableCell className="font-medium">{challan.challan_number}</TableCell>
                  <TableCell>{format(new Date(challan.created_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    {challan.customer?.name}
                    <div className="text-xs text-muted-foreground">{challan.customer?.business_name}</div>
                  </TableCell>
                  <TableCell>{challan.total_quantity}</TableCell>
                  <TableCell>{Number(challan.total_amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      challan.status === 'Confirmed' ? 'default' :
                      challan.status === 'Draft' ? 'secondary' : 'destructive'
                    }>
                      {challan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {challan.status === 'Draft' && canEdit && (
                      <>
                        <Button variant="outline" size="icon" title="Confirm" onClick={() => handleConfirm(challan.id)}>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="outline" size="icon" title="Cancel" onClick={() => handleCancel(challan.id)}>
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    {challan.status === 'Confirmed' && (
                      <Button variant="outline" size="sm" onClick={() => handleDownload(challan.id)}>
                        <FileDown className="h-4 w-4 mr-2" /> PDF
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Showing {data?.data.length || 0} of {data?.meta.total || 0} challans
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

      <ChallanDialog 
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

export default Challans;
