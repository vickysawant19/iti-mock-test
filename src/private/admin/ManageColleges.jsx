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
  Building2,
  Filter,
  Loader2,
  AlertCircle,
  MapPin,
  ClipboardList,
  Check
} from "lucide-react";

import {
  useListCollegesQuery,
  useCreateCollegeMutation,
  useUpdateCollegeMutation,
  useDeleteCollegeMutation,
} from "@/store/api/collegeApi";
import { useListTradesQuery } from "@/store/api/tradeApi";

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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

const ManageColleges = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [formData, setFormData] = useState({
    collageName: "",
    location: "",
    tradeIds: [],
    isActive: true,
  });

  // API Hooks
  const { data: collegesResponse, isLoading: collegesLoading, error: collegeError } = useListCollegesQuery();
  const { data: tradesResponse, isLoading: tradesLoading } = useListTradesQuery();
  
  const [createCollege, { isLoading: isCreating }] = useCreateCollegeMutation();
  const [updateCollege, { isLoading: isUpdating }] = useUpdateCollegeMutation();
  const [deleteCollege] = useDeleteCollegeMutation();

  const colleges = collegesResponse?.documents || [];
  const allTrades = tradesResponse?.documents || [];

  // Filtered colleges
  const filteredColleges = colleges.filter((college) => {
    const matchesSearch = college.collageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (college.location && college.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && college.isActive) || 
      (statusFilter === "inactive" && !college.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingCollege(null);
    setFormData({
      collageName: "",
      location: "",
      tradeIds: [],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (college) => {
    setEditingCollege(college);
    setFormData({
      collageName: college.collageName,
      location: college.location || "",
      tradeIds: college.tradeIds || [],
      isActive: college.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.collageName.trim()) {
      toast.error("College name is required");
      return;
    }

    try {
      if (editingCollege) {
        await updateCollege({
          collegeId: editingCollege.$id,
          updatedData: formData,
        }).unwrap();
        toast.success("College updated successfully");
      } else {
        await createCollege(formData).unwrap();
        toast.success("College created successfully");
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save college");
    }
  };

  const handleDelete = async (collegeId) => {
    if (window.confirm("Are you sure you want to delete this college?")) {
      try {
        await deleteCollege(collegeId).unwrap();
        toast.success("College deleted successfully");
      } catch (err) {
        toast.error("Failed to delete college");
      }
    }
  };

  const toggleTrade = (tradeId) => {
    setFormData((prev) => {
      const isSelected = prev.tradeIds.includes(tradeId);
      if (isSelected) {
        return { ...prev, tradeIds: prev.tradeIds.filter((id) => id !== tradeId) };
      } else {
        return { ...prev, tradeIds: [...prev.tradeIds, tradeId] };
      }
    });
  };

  const toggleStatus = async (college) => {
    try {
      await updateCollege({
        collegeId: college.$id,
        updatedData: { isActive: !college.isActive },
      }).unwrap();
      toast.success(`College ${college.isActive ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (collegeError) {
    return (
      <div className="p-8 text-center bg-background min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Colleges</h2>
        <p className="text-muted-foreground">{collegeError.message || "An unknown error occurred"}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">College Management</h1>
          <p className="text-muted-foreground">Administer ITI colleges and assign available trades.</p>
        </div>
        <Button onClick={handleOpenAddModal} className="gap-2 shadow-lg shadow-primary/20">
          <Plus size={18} /> Add New College
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="md:col-span-3 overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Colleges List
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search colleges..."
                  className="pl-9 bg-background/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {collegesLoading ? (
              <div className="p-20 flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Fetching colleges...</p>
              </div>
            ) : filteredColleges.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[35%]">College Name</TableHead>
                      <TableHead className="w-[15%]">Trades</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredColleges.map((college) => (
                      <TableRow key={college.$id} className="hover:bg-muted/30 transition-colors group">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <Building2 size={18} />
                            </div>
                            <span className="truncate">{college.collageName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1 font-mono">
                            <ClipboardList size={12} />
                            {college.tradeIds?.length || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={college.isActive ? "success" : "secondary"}
                            className={college.isActive 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                            }
                          >
                            {college.isActive ? (
                              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Active</span>
                            ) : (
                              <span className="flex items-center gap-1"><XCircle size={12} /> Inactive</span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin size={12} className="opacity-50" />
                            {college.location || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 shadow-xl">
                              <DropdownMenuItem onClick={() => handleOpenEditModal(college)} className="gap-2">
                                <Edit2 size={14} /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(college)} className="gap-2">
                                {college.isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                                {college.isActive ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(college.$id)} 
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
                  <Building2 size={40} className="text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-xl font-semibold mb-1">No colleges found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {searchTerm 
                    ? "Adjust your search filters to find what you're looking for." 
                    : "Add your first ITI college to start managing trade affiliations."}
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
                Filters & Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Show Status</Label>
                <div className="flex flex-col gap-1">
                  <Button 
                    variant={statusFilter === "all" ? "secondary" : "ghost"} 
                    className="justify-start font-normal h-9"
                    onClick={() => setStatusFilter("all")}
                  >
                    All Colleges
                  </Button>
                  <Button 
                    variant={statusFilter === "active" ? "secondary" : "ghost"} 
                    className={`justify-start font-normal h-9 ${statusFilter === "active" ? "text-emerald-600" : ""}`}
                    onClick={() => setStatusFilter("active")}
                  >
                    Active Only
                  </Button>
                </div>
              </div>
              
              <div className="pt-2 border-t border-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold">{colleges.length}</p>
                    <p className="text-[10px] uppercase text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold">{allTrades.length}</p>
                    <p className="text-[10px] uppercase text-muted-foreground">Trades</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingCollege ? "Edit College" : "Add New College"}</DialogTitle>
            <DialogDescription>
              {editingCollege ? "Update specific details or assigned trades." : "Provide college details and select available trades."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto px-1 py-4">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="collageName">College Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="collageName"
                    placeholder="e.g. ITI Dodamarg"
                    value={formData.collageName}
                    onChange={(e) => setFormData({ ...formData, collageName: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="City, State"
                      className="pl-9"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Assign Trades</Label>
                  <span className="text-xs text-muted-foreground">{formData.tradeIds.length} selected</span>
                </div>
                <Card className="border-muted/50 bg-muted/20">
                  <ScrollArea className="h-[250px] w-full p-4">
                    {tradesLoading ? (
                      <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading trades...</span>
                      </div>
                    ) : allTrades.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allTrades.map((trade) => {
                          const isSelected = formData.tradeIds.includes(trade.$id);
                          return (
                            <div 
                              key={trade.$id}
                              onClick={() => toggleTrade(trade.$id)}
                              className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-sm' 
                                  : 'bg-background border-muted hover:border-primary/50'
                              }`}
                            >
                              <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted-foreground/30'
                              }`}>
                                {isSelected && <Check size={14} strokeWidth={3} />}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-sm font-medium leading-none ${isSelected ? 'text-primary' : ''}`}>
                                  {trade.tradeName}
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-1 uppercase">
                                  {trade.duration}Y
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-sm text-muted-foreground">No trades defined yet.</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Add trades in Trade Management first.</p>
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-muted/50">
                <div className="space-y-0.5">
                  <Label className="text-base text-card-foreground">Active College</Label>
                  <p className="text-xs text-muted-foreground">Toggle this to hide/show the college in system-wide lists.</p>
                </div>
                <div 
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none ${formData.isActive ? 'bg-primary' : 'bg-input'}`}
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                >
                  <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="pt-6 border-t gap-2 bg-background sticky bottom-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isCreating || isUpdating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="min-w-[120px]">
                {(isCreating || isUpdating) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingCollege ? "Update College" : "Create College"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageColleges;
