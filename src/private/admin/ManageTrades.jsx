import React, { useState } from "react";
import { toast } from "react-toastify";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  CheckCircle2, 
  XCircle,
  Briefcase,
  Filter,
  Loader2,
  AlertCircle
} from "lucide-react";

import {
  useListTradesQuery,
  useCreateTradeMutation,
  useUpdateTradeMutation,
  useDeleteTradeMutation,
} from "@/store/api/tradeApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const ManageTrades = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [formData, setFormData] = useState({
    tradeName: "",
    duration: 1,
    description: "",
    isActive: true,
  });

  // API Hooks
  const { data: tradesResponse, isLoading, error } = useListTradesQuery();
  const [createTrade, { isLoading: isCreating }] = useCreateTradeMutation();
  const [updateTrade, { isLoading: isUpdating }] = useUpdateTradeMutation();
  const [deleteTrade] = useDeleteTradeMutation();

  const trades = tradesResponse?.documents || [];

  // Filtered trades
  const filteredTrades = trades.filter((trade) => {
    const matchesSearch = trade.tradeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && trade.isActive) || 
      (statusFilter === "inactive" && !trade.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingTrade(null);
    setFormData({
      tradeName: "",
      duration: 1,
      description: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trade) => {
    setEditingTrade(trade);
    setFormData({
      tradeName: trade.tradeName,
      duration: trade.duration,
      description: trade.description || "",
      isActive: trade.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tradeName.trim()) {
      toast.error("Trade name is required");
      return;
    }

    try {
      if (editingTrade) {
        await updateTrade({
          tradeId: editingTrade.$id,
          updatedData: formData,
        }).unwrap();
        toast.success("Trade updated successfully");
      } else {
        await createTrade(formData).unwrap();
        toast.success("Trade created successfully");
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save trade");
    }
  };

  const handleDelete = async (tradeId) => {
    if (window.confirm("Are you sure you want to delete this trade?")) {
      try {
        await deleteTrade(tradeId).unwrap();
        toast.success("Trade deleted successfully");
      } catch (err) {
        toast.error("Failed to delete trade");
      }
    }
  };

  const toggleStatus = async (trade) => {
    try {
      await updateTrade({
        tradeId: trade.$id,
        updatedData: { isActive: !trade.isActive },
      }).unwrap();
      toast.success(`Trade ${trade.isActive ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-background min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Trades</h2>
        <p className="text-muted-foreground">{error.message || "An unknown error occurred"}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Management</h1>
          <p className="text-muted-foreground">Configure and manage ITI trade specializations.</p>
        </div>
        <Button onClick={handleOpenAddModal} className="gap-2 shadow-lg shadow-primary/20">
          <Plus size={18} /> Add New Trade
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="md:col-span-3 overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Trades List
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trades..."
                  className="pl-9 bg-background/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-20 flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Fetching trades...</p>
              </div>
            ) : filteredTrades.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[30%]">Trade Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map((trade) => (
                      <TableRow key={trade.$id} className="hover:bg-muted/30 transition-colors group">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{trade.tradeName}</span>
                            <span className="text-xs text-muted-foreground font-normal line-clamp-1 max-w-[200px]">
                              {trade.description || "No description"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            {trade.duration} {trade.duration === 1 ? "Year" : "Years"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={trade.isActive ? "success" : "secondary"}
                            className={trade.isActive 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                            }
                          >
                            {trade.isActive ? (
                              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Active</span>
                            ) : (
                              <span className="flex items-center gap-1"><XCircle size={12} /> Inactive</span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs font-mono">
                          {new Date(trade.$createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 shadow-xl">
                              <DropdownMenuItem onClick={() => handleOpenEditModal(trade)} className="gap-2">
                                <Edit2 size={14} /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(trade)} className="gap-2">
                                {trade.isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                                {trade.isActive ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(trade.$id)} 
                                className="text-destructive gap-2 focus:bg-destructive/10 focus:text-destructive"
                              >
                                <Trash2 size={14} /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-20 flex flex-col items-center justify-center text-center">
                <div className="bg-muted rounded-full p-6 mb-4">
                  <Briefcase size={40} className="text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-xl font-semibold mb-1">No trades found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {searchTerm 
                    ? "Adjust your search filters to find what you're looking for." 
                    : "Get started by adding your first ITI trade specialization."}
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>Clear Search</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-white/10">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Quick Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-2">
              <Button 
                variant={statusFilter === "all" ? "secondary" : "ghost"} 
                className="justify-start font-normal h-9"
                onClick={() => setStatusFilter("all")}
              >
                All Trades ({trades.length})
              </Button>
              <Button 
                variant={statusFilter === "active" ? "secondary" : "ghost"} 
                className={`justify-start font-normal h-9 ${statusFilter === "active" ? "text-emerald-600" : ""}`}
                onClick={() => setStatusFilter("active")}
              >
                Active Only ({trades.filter(t => t.isActive).length})
              </Button>
              <Button 
                variant={statusFilter === "inactive" ? "secondary" : "ghost"} 
                className={`justify-start font-normal h-9 ${statusFilter === "inactive" ? "text-red-600" : ""}`}
                onClick={() => setStatusFilter("inactive")}
              >
                Inactive Only ({trades.filter(t => !t.isActive).length})
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10 shadow-none">
            <CardContent className="p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0" />
              <p className="text-xs text-primary/80 leading-relaxed">
                Changes made here will affect student registration, module assignments, and exam configurations across the system.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTrade ? "Edit Trade" : "Add New Trade"}</DialogTitle>
            <DialogDescription>
              {editingTrade ? "Update the details for the selected ITI trade." : "Fill in the details to create a new trade specialization."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="tradeName">Trade Name <span className="text-destructive">*</span></Label>
                <Input
                  id="tradeName"
                  placeholder="e.g. COPA"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Years)</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(val) => setFormData({ ...formData, duration: parseInt(val) })}
                >
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Year</SelectItem>
                    <SelectItem value="2">2 Years</SelectItem>
                    <SelectItem value="3">3 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Short description of the trade..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-muted/50 mt-2">
                <div className="space-y-0.5">
                  <Label className="text-base">Active Status</Label>
                  <p className="text-xs text-muted-foreground font-normal">Only active trades are visible to users.</p>
                </div>
                <div 
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${formData.isActive ? 'bg-primary' : 'bg-input'}`}
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                >
                  <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isCreating || isUpdating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="min-w-[100px]">
                {(isCreating || isUpdating) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  editingTrade ? "Update Trade" : "Create Trade"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageTrades;
