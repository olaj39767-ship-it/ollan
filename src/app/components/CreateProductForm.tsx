// src/components/CreateProductForm.tsx
import React, { useCallback } from "react";
import { Card, CardContent, CardActions, Box, Typography, TextField, Button, CircularProgress } from "@mui/material";
import { Save, CloudUpload } from "@mui/icons-material";
import { toast } from "react-toastify";

interface NewProduct {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image: File | null;
}

interface CreateProductFormProps {
  newProduct: NewProduct;
  setNewProduct: React.Dispatch<React.SetStateAction<NewProduct>>;
  loading: boolean;
  handleCreateProduct: () => Promise<void>;
  setIsCreating: React.Dispatch<React.SetStateAction<boolean>>;
  fetchProducts: () => Promise<void>;
}

const CreateProductForm: React.FC<CreateProductFormProps> = React.memo(
  ({ newProduct, setNewProduct, loading, handleCreateProduct, setIsCreating, fetchProducts }) => {
    const handleNewProductChange = useCallback(
      (field: keyof NewProduct, value: string | File | null) => {
        setNewProduct((prev) => ({ ...prev, [field]: value }));
      },
      [setNewProduct]
    );

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            Create New Product
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={newProduct.name}
              onChange={(e) => handleNewProductChange("name", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              required
              size="small"
              autoFocus
            />
            <TextField
              fullWidth
              label="Description"
              value={newProduct.description}
              onChange={(e) => handleNewProductChange("description", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              multiline
              rows={2}
              size="small"
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                label="Price ($)"
                type="number"
                value={newProduct.price}
                onChange={(e) => handleNewProductChange("price", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                required
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Stock"
                type="number"
                value={newProduct.stock}
                onChange={(e) => handleNewProductChange("stock", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                required
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              fullWidth
              label="Category"
              value={newProduct.category}
              onChange={(e) => handleNewProductChange("category", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              size="small"
            />
            <Box>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="new-product-image"
                type="file"
                onChange={(e) => handleNewProductChange("image", e.target.files?.[0] || null)}
              />
              <label htmlFor="new-product-image">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  fullWidth
                >
                  Upload Image
                </Button>
              </label>
              {newProduct.image && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: "block" }}>
                  Selected: {newProduct.image.name}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            onClick={handleCreateProduct}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            fullWidth
          >
            Create Product
          </Button>
        </CardActions>
      </Card>
    );
  }
);

export default CreateProductForm;