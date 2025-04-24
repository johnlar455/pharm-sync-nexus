
import { useState } from 'react';
import { Search, Plus, Filter, ArrowDown, ArrowUp, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Mock data for medicines
const mockMedicines = Array.from({ length: 20 }).map((_, i) => {
  const categories = ['Pain Relief', 'Antibiotics', 'Antihistamines', 'Vitamins', 'Cardiovascular'];
  const statuses = ['In Stock', 'Low Stock', 'Out of Stock'];
  
  return {
    id: `med-${i + 1}`,
    name: [
      'Paracetamol', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Cetirizine',
      'Loratadine', 'Vitamin C', 'Vitamin D', 'Atorvastatin', 'Simvastatin',
      'Metformin', 'Omeprazole', 'Lisinopril', 'Levothyroxine', 'Amlodipine',
      'Albuterol', 'Fluoxetine', 'Gabapentin', 'Metoprolol', 'Losartan',
    ][i % 20],
    sku: `MED-${String(i + 1).padStart(3, '0')}`,
    category: categories[i % categories.length],
    manufacturer: [
      'PharmaTech', 'MediCorp', 'HealthLabs', 'VitaPharm', 'BioMed',
      'CureTech', 'Global Pharma', 'MedWell', 'LifeScience', 'HealPharma',
    ][i % 10],
    price: Math.round((Math.random() * 50 + 5) * 100) / 100,
    stock: i % 3 === 0 ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 100) + 20,
    status: i % 3 === 0 ? statuses[1] : (i % 7 === 0 ? statuses[2] : statuses[0]),
    prescription: i % 4 === 0,
  };
});

export default function MedicinesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort medicines
  const filteredMedicines = mockMedicines.filter((med) => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          med.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || med.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    const fieldA = a[sortField as keyof typeof a];
    const fieldB = b[sortField as keyof typeof b];
    
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB) 
        : fieldB.localeCompare(fieldA);
    }
    
    if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return sortDirection === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    }
    
    return 0;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(mockMedicines.map(med => med.category)));

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Get stock status badge
  const getStockBadge = (status: string) => {
    switch (status) {
      case 'In Stock':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">In Stock</Badge>;
      case 'Low Stock':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Low Stock</Badge>;
      case 'Out of Stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  const handleAddMedicine = () => {
    toast({
      title: 'Add Medicine',
      description: 'The add medicine form would open here.',
    });
  };

  const handleExport = () => {
    toast({
      title: 'Export Medicines',
      description: 'Medicines list export started.',
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: 'Generate Report',
      description: 'Generating medicines inventory report.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Medicines</h1>
          <p className="text-muted-foreground">Manage your pharmacy products</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleGenerateReport}>
            <FileText className="mr-2 h-4 w-4" />
            Report
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleAddMedicine}>
            <Plus className="mr-2 h-4 w-4" />
            Add Medicine
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search medicines..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Medicines Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <button
                  className="flex items-center"
                  onClick={() => handleSort('name')}
                >
                  Name
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('category')}
                >
                  Category
                  {sortField === 'category' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('price')}
                >
                  Price
                  {sortField === 'price' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('stock')}
                >
                  Stock
                  {sortField === 'stock' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prescription</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedicines.map((medicine) => (
              <TableRow key={medicine.id}>
                <TableCell className="font-medium">{medicine.name}</TableCell>
                <TableCell className="text-sm">{medicine.sku}</TableCell>
                <TableCell>{medicine.category}</TableCell>
                <TableCell>{formatPrice(medicine.price)}</TableCell>
                <TableCell>{medicine.stock}</TableCell>
                <TableCell>{getStockBadge(medicine.status)}</TableCell>
                <TableCell>
                  {medicine.prescription ? (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Required</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
