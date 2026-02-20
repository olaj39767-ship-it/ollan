// src/components/ProductCard.tsx
import React, { useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Divider,
  TextField,
  Button,
  Checkbox,
} from "@mui/material";
import {
  ExpandMore,
  Edit,
  CheckCircle,
  AttachMoney,
  Inventory,
  Category,
  CloudUpload,
} from "@mui/icons-material";
import { toast } from "react-toastify";

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

interface ProductCardProps {
  product: Product;
  editedProducts: EditedProduct;
  setEditedProducts: React.Dispatch<React.SetStateAction<EditedProduct>>;
  selectedImage: { [key: string]: File };
  setSelectedImage: React.Dispatch<React.SetStateAction<{ [key: string]: File }>>;
  expandedCards: Set<string>;
  setExpandedCards: React.Dispatch<React.SetStateAction<Set<string>>>;
  editingProduct: string | null;
  setEditingProduct: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean;
  selectionMode: boolean;
  selectedProducts: string[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<string[]>>;
  handleSaveProduct: (productId: string) => Promise<void>;
  handleSelectProduct: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({
    product,
    editedProducts,
    setEditedProducts,
    selectedImage,
    setSelectedImage,
    expandedCards,
    setExpandedCards,
    editingProduct,
    setEditingProduct,
    loading,
    selectionMode,
    selectedProducts,
    setSelectedProducts,
    handleSaveProduct,
    handleSelectProduct,
  }) => {
    const isExpanded = expandedCards.has(product._id);
    const isEditing = editingProduct === product._id;
    const hasChanges = !!editedProducts[product._id] || !!selectedImage[product._id];

    // Utility functions
    const parseNumericValue = (value: string): number | null => {
      if (value === "" || value === null || value === undefined) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    const getCurrentValue = (field: keyof Product, originalValue: any) => {
      const editedValue = editedProducts[product._id]?.[field];
      return editedValue !== undefined ? editedValue : originalValue;
    };

    const hasNumericError = (field: "price" | "stock", originalValue: number) => {
      const editedValue = editedProducts[product._id]?.[field];
      if (editedValue === undefined) return false;
      return isNaN(editedValue as number) || editedValue < 0;
    };

    // Debounce input changes
    const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
      let timeout: NodeJS.Timeout;
      return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };

    const handleInputChange = useCallback(
      (field: keyof Product, value: string) => {
        if (field === "price" || field === "stock") {
          if (value === "") {
            setEditedProducts((prev) => {
              const newEdits = { ...prev };
              if (newEdits[product._id]) {
                delete newEdits[product._id][field];
                if (Object.keys(newEdits[product._id]).length === 0) {
                  delete newEdits[product._id];
                }
              }
              return newEdits;
            });
            return;
          }

          const numValue = parseNumericValue(value);
          if (numValue === null || numValue < 0) return;

          setEditedProducts((prev) => ({
            ...prev,
            [product._id]: { ...prev[product._id], [field]: numValue },
          }));
        } else {
          setEditedProducts((prev) => ({
            ...prev,
            [product._id]: { ...prev[product._id], [field]: value },
          }));
        }
      },
      [product._id, setEditedProducts]
    );

    const debouncedHandleInputChange = useMemo(
      () => debounce(handleInputChange, 300),
      [handleInputChange]
    );

    const handleImageChange = useCallback(
      (file: File | null) => {
        if (file) {
          setSelectedImage((prev) => ({ ...prev, [product._id]: file }));
        }
      },
      [product._id, setSelectedImage]
    );

    const toggleCardExpansion = useCallback(() => {
      setExpandedCards((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(product._id)) {
          newSet.delete(product._id);
        } else {
          newSet.add(product._id);
        }
        return newSet;
      });
    }, [product._id, setExpandedCards]);

    return (
      <Card
        sx={{
          mb: 2,
          boxShadow: hasChanges ? 3 : 1,
          border: hasChanges ? 2 : 1,
          borderColor: hasChanges ? "primary.main" : "divider",
          transition: "all 0.3s ease",
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* Product Header */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            {selectionMode && (
              <Checkbox
                checked={selectedProducts.includes(product._id)}
                onChange={() => handleSelectProduct(product._id)}
                sx={{ mr: 1 }}
              />
            )}
            <Avatar
              src={product.image || undefined}
              alt={product.name}
              sx={{ width: 48, height: 48, mr: 2 }}
              variant="rounded"
            >
              {product.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: "1.1rem" }} noWrap>
                {product.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <Chip
                  label={`$${product.price}`}
                  size="small"
                  color="primary"
                  icon={<AttachMoney />}
                />
                <Chip
                  label={`Stock: ${product.stock}`}
                  size="small"
                  color={product.stock > 0 ? "success" : "error"}
                  icon={<Inventory />}
                />
              </Box>
            </Box>
            <IconButton onClick={toggleCardExpansion} sx={{ ml: 1 }}>
              <ExpandMore
                sx={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              />
            </IconButton>
          </Box>

          {/* Quick Info */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            {product.category && (
              <Chip
                label={product.category}
                size="small"
                variant="outlined"
                icon={<Category />}
              />
            )}
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => setEditingProduct(isEditing ? null : product._id)}
                color={isEditing ? "primary" : "default"}
              >
                <Edit />
              </IconButton>
              {hasChanges && (
                <IconButton
                  size="small"
                  onClick={() => handleSaveProduct(product._id)}
                  color="success"
                  disabled={loading}
                >
                  <CheckCircle />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Expanded Content */}
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Divider sx={{ mb: 2 }} />
            {isEditing ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Name"
                  value={getCurrentValue("name", product.name)}
                  onChange={(e) => debouncedHandleInputChange("name", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  size="small"
                  error={editedProducts[product._id]?.name === ""}
                  helperText={editedProducts[product._id]?.name === "" ? "Name is required" : ""}
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={getCurrentValue("description", product.description || "")}
                  onChange={(e) => debouncedHandleInputChange("description", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  size="small"
                  multiline
                  rows={2}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    label="Price ($)"
                    type="number"
                    value={getCurrentValue("price", product.price)}
                    onChange={(e) => debouncedHandleInputChange("price", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    size="small"
                    error={hasNumericError("price", product.price)}
                    helperText={hasNumericError("price", product.price) ? "Price must be ≥ 0" : ""}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Stock"
                    type="number"
                    value={getCurrentValue("stock", product.stock)}
                    onChange={(e) => debouncedHandleInputChange("stock", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    size="small"
                    error={hasNumericError("stock", product.stock)}
                    helperText={hasNumericError("stock", product.stock) ? "Stock must be ≥ 0" : ""}
                    sx={{ flex: 1 }}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Category"
                  value={getCurrentValue("category", product.category || "")}
                  onChange={(e) => debouncedHandleInputChange("category", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  size="small"
                />
                <Box>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id={`image-upload-${product._id}`}
                    type="file"
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                  />
                  <label htmlFor={`image-upload-${product._id}`}>
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      size="small"
                      fullWidth
                    >
                      Change Image
                    </Button>
                  </label>
                  {selectedImage[product._id] && (
                    <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>
                      New image selected: {selectedImage[product._id].name}
                    </Typography>
                  )}
                </Box>
              </Box>
            ) : (
              <Box>
                {product.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {product.description}
                  </Typography>
                )}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  <Chip label={`ID: ${product._id.slice(-6)}`} size="small" variant="outlined" />
                  {product.createdBy && (
                    <Chip
                      label={`By: ${product.createdBy.name}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.product._id === nextProps.product._id &&
      prevProps.product.name === nextProps.product.name &&
      prevProps.product.description === nextProps.product.description &&
      prevProps.product.price === nextProps.product.price &&
      prevProps.product.stock === nextProps.product.stock &&
      prevProps.product.category === nextProps.product.category &&
      prevProps.product.image === nextProps.product.image &&
      prevProps.editedProducts[prevProps.product._id] === nextProps.editedProducts[nextProps.product._id] &&
      prevProps.selectedImage[prevProps.product._id] === nextProps.selectedImage[nextProps.product._id] &&
      prevProps.expandedCards.has(prevProps.product._id) === nextProps.expandedCards.has(nextProps.product._id) &&
      prevProps.editingProduct === nextProps.editingProduct &&
      prevProps.loading === nextProps.loading &&
      prevProps.selectionMode === nextProps.selectionMode &&
      prevProps.selectedProducts.includes(prevProps.product._id) === nextProps.selectedProducts.includes(nextProps.product._id)
    );
  }
);

export default ProductCard;