import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/api/product.api';
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
import { Plus, Search, AlertTriangle } from 'lucide-react';
import ProductDialog from '@/components/products/ProductDialog';
import { Product } from '@/types/product.types';

const Products = () => {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productApi.list({ page, search }),
  });

  const canEdit = user?.role === 'Admin' || user?.role === 'Warehouse';

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Products Catalog</h2>
        {canEdit && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products (SKU, Name)..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((product) => {
                const isLowStock = product.current_stock <= product.min_stock_alert;
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.sku}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell>₹{Number(product.unit_price).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{product.current_stock}</span>
                        {isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-destructive" title="Low Stock!" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.location || '-'}</TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Showing {data?.data.length || 0} of {data?.meta.total || 0} products
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

      <ProductDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        product={editingProduct}
        onSuccess={() => {
          setDialogOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default Products;
