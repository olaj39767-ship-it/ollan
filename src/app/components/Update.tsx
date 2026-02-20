
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  TextField,
  Button,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  CircularProgress,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from "@mui/material";
import { Add, SelectAll } from "@mui/icons-material";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CreateProductForm from "./CreateProductForm";
import SearchAndFilters from "./SearchAndFilters";
import SelectionModeHeader from "./SelectionModeHeader";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import Navbar from "./Navbar2";

// Define TypeScript interfaces
interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  image?: string | null;
  imagePublicId?: string | null;
  createdBy?: { name: string; email: string } | null;
}

interface EditedProduct {
  [key: string]: Partial<Product>;
}

interface NewProduct {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image: File | null;
}

// Sorting direction
type Order = "asc" | "desc";

const ProductManagement: React.FC = () => {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [editedProducts, setEditedProducts] = useState<EditedProduct>({});
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<{ [key: string]: File }>({});
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    image: null,
  });
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<keyof Product>("name");

  // Base URL for backend
  const API_URL = "https://ollanbackend.vercel.app/api/products";

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to access products");
        setLoading(false);
        return;
      }
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
      setLoading(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch products. Please check your internet connection.");
      setLoading(false);
    }
  };

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    // Sorting
    return result.sort((a, b) => {
      const aValue = a[orderBy] ?? "";
      const bValue = b[orderBy] ?? "";
      if (order === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [products, searchTerm, filterCategory, order, orderBy]);

  // Memoized categories
  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((p) => p.category).filter((cat): cat is string => typeof cat === "string"))
    );
  }, [products]);

  // Handle create product
  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock || !newProduct.category) {
      toast.warn("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to create products");
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("description", newProduct.description);
      formData.append("price", newProduct.price);
      formData.append("stock", newProduct.stock);
      formData.append("category", newProduct.category);
      if (newProduct.image) {
        formData.append("image", newProduct.image);
      }
      await axios.post(`${API_URL}/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Product created successfully.");
      setIsCreating(false);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "",
        image: null,
      });
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  // Handle save product
 // Handle save product - FIXED VERSION
const handleSaveProduct = async (productId: string): Promise<void> => {
  const edited = editedProducts[productId];
  const hasImageChange = selectedImage[productId];
  
  // Check if there are any changes at all (either field changes or image change)
  if ((!edited || Object.keys(edited).length === 0) && !hasImageChange) {
    toast.info("No changes to save.");
    return;
  }
  
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to update products");
      setLoading(false);
      return;
    }

    // Create FormData for the update request
    const formData = new FormData();
    
    // Add text fields to FormData
    if (edited) {
      Object.entries(edited).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
    }
    
    // Add image file if selected
    if (hasImageChange) {
      formData.append("image", selectedImage[productId]);
    }

    // Send update request with FormData
    const response = await axios.put(`${API_URL}/${productId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success("Product updated successfully.");
    
    // Update local state with the response data
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, ...response.data.product } : p))
    );
    
    // Clear editing states
    setEditedProducts((prev) => {
      const newEdited = { ...prev };
      delete newEdited[productId];
      return newEdited;
    });
    
    setSelectedImage((prev) => {
      const newSelected = { ...prev };
      delete newSelected[productId];
      return newSelected;
    });
    
    setEditingProduct(null);
    
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Failed to update product.");
  } finally {
    setLoading(false);
  }
};

// Alternative approach - Handle image change to also update editedProducts
const handleImageChange = (productId: string, file: File) => {
  setSelectedImage((prev) => ({
    ...prev,
    [productId]: file,
  }));
  
  // Also mark that this product has been edited
  setEditedProducts((prev) => ({
    ...prev,
    [productId]: {
      ...prev[productId],
      _imageChanged: true, // Flag to indicate image was changed
    },
  }));
};

  // Handle input change for editing
  const handleInputChange = (productId: string, field: keyof Product, value: any) => {
    setEditedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  // Handle image change
 

  // Handle select product
  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProducts((prevSelected) =>
      prevSelected.includes(productId)
        ? prevSelected.filter((id) => id !== productId)
        : [...prevSelected, productId]
    );
  }, [selectedProducts]);

  // Handle selection mode
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev);
    if (selectionMode) {
      setSelectedProducts([]);
    }
  }, [selectionMode]);

  // Handle delete dialog
  const handleOpenDialog = useCallback(() => {
    if (selectedProducts.length > 0) {
      setOpenDialog(true);
    } else {
      toast.warn("Please select at least one product to delete");
    }
  }, [selectedProducts]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(() => {
    setOpenDialog(false);
    handleDelete();
  }, [selectedProducts]);

  // Handle delete products
  const handleDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.warn("No products selected for deletion.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to delete products");
        setLoading(false);
        return;
      }

      const deletePromises = selectedProducts.map((id) =>
        axios.delete(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      await Promise.all(deletePromises);

      toast.success("Selected products deleted successfully.");
      setProducts((prev) => prev.filter((p) => !selectedProducts.includes(p._id)));
      setSelectedProducts([]);
      setSelectionMode(false);
    } catch (error: any) {
      const message =
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : error.response?.status === 404
          ? "One or more products not found."
          : error.code === "ECONNABORTED"
          ? "Request timed out. Please check your internet connection."
          : error.response?.data?.message || "Failed to delete products.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle sorting
  const handleSort = (property: keyof Product) => () => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Mobile Header */}
      <Navbar />

      {/* Main Content */}
      <Box sx={{ maxWidth: { xs: "100%", sm: 600, md: 960, lg: 1280, xl: 1920 }, mx: "auto", px: { xs: 2, sm: 3, md: 4 }, pb: 10 }}>
        {/* Search and Filters */}
        <SearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          categories={categories}
        />

        {/* Selection Mode Header */}
        {selectionMode && (
          <SelectionModeHeader
            selectedProducts={selectedProducts}
            filteredProducts={filteredProducts}
            setSelectedProducts={setSelectedProducts}
            handleOpenDialog={handleOpenDialog}
          />
        )}

        {/* Create Product Form */}
        {isCreating && (
          <CreateProductForm
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            loading={loading}
            handleCreateProduct={handleCreateProduct}
            setIsCreating={setIsCreating}
            fetchProducts={fetchProducts}
          />
        )}

        {/* Products Table */}
        {loading && products.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
              {filteredProducts.length} Product{filteredProducts.length !== 1 ? "s" : ""}
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {selectionMode && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onChange={() =>
                            setSelectedProducts(
                              selectedProducts.length === filteredProducts.length
                                ? []
                                : filteredProducts.map((p) => p._id)
                            )
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "name"}
                        direction={orderBy === "name" ? order : "asc"}
                        onClick={handleSort("name")}
                      >
                        Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "price"}
                        direction={orderBy === "price" ? order : "asc"}
                        onClick={handleSort("price")}
                      >
                        Price
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "stock"}
                        direction={orderBy === "stock" ? order : "asc"}
                        onClick={handleSort("stock")}
                      >
                        Stock
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product._id} hover>
                      {selectionMode && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => handleSelectProduct(product._id)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        {editingProduct === product._id ? (
                          <TextField
                            value={editedProducts[product._id]?.name ?? product.name}
                            onChange={(e) => handleInputChange(product._id, "name", e.target.value)}
                            size="small"
                            fullWidth
                            inputProps={{ "aria-label": "Product name" }}
                          />
                        ) : (
                          product.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProduct === product._id ? (
                          <TextField
                            value={editedProducts[product._id]?.description ?? product.description ?? ""}
                            onChange={(e) => handleInputChange(product._id, "description", e.target.value)}
                            size="small"
                            fullWidth
                            inputProps={{ "aria-label": "Product description" }}
                          />
                        ) : (
                          product.description ?? "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {product.price == null
                          ? "-"
                          : editingProduct === product._id ? (
                              <TextField
                                type="number"
                                value={editedProducts[product._id]?.price ?? product.price}
                                onChange={(e) => handleInputChange(product._id, "price", parseFloat(e.target.value))}
                                size="small"
                                fullWidth
                                inputProps={{ "aria-label": "Product price" }}
                              />
                            ) : (
                              `₦${product.price.toFixed(2)}`
                            )}
                      </TableCell>
                      <TableCell>
                        {product.stock == null
                          ? "-"
                          : editingProduct === product._id ? (
                              <TextField
                                type="number"
                                value={editedProducts[product._id]?.stock ?? product.stock}
                                onChange={(e) => handleInputChange(product._id, "stock", parseInt(e.target.value))}
                                size="small"
                                fullWidth
                                inputProps={{ "aria-label": "Product stock" }}
                              />
                            ) : (
                              product.stock
                            )}
                      </TableCell>
                      <TableCell>
                        {editingProduct === product._id ? (
                          <TextField
                            value={editedProducts[product._id]?.category ?? product.category ?? ""}
                            onChange={(e) => handleInputChange(product._id, "category", e.target.value)}
                            size="small"
                            fullWidth
                            inputProps={{ "aria-label": "Product category" }}
                          />
                        ) : (
                          product.category ?? "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProduct === product._id ? (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleImageChange(product._id, e.target.files[0]);
                              }
                            }}
                            aria-label="Upload product image"
                          />
                        ) : product.image ? (
                          <img src={product.image} alt={product.name} style={{ width: 50, height: 50, objectFit: "cover" }} />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProduct === product._id ? (
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleSaveProduct(product._id)}
                              disabled={loading}
                              sx={{ mr: 1 }}
                              aria-label="Save product"
                            >
                              Save
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              onClick={() => setEditingProduct(null)}
                              aria-label="Cancel edit"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => setEditingProduct(product._id)}
                            disabled={selectionMode}
                            aria-label={`Edit product ${product.name}`}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No products found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Box>
        )}

        {/* Floating Action Button */}
        <SpeedDial
          ariaLabel="Product actions"
          sx={{ position: "fixed", bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<Add />}
            tooltipTitle="Create Product"
            onClick={() => setIsCreating(!isCreating)}
          />
          <SpeedDialAction
            icon={<SelectAll />}
            tooltipTitle="Select Mode"
            onClick={toggleSelectionMode}
          />
        </SpeedDial>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          openDialog={openDialog}
          selectedProducts={selectedProducts}
          handleCloseDialog={handleCloseDialog}
          handleConfirmDelete={handleConfirmDelete}
          handleDelete={handleDelete}
        />

        <ToastContainer position="top-center" autoClose={3000} />
      </Box>
    </Box>
  );
};

export default ProductManagement;