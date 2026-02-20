// src/components/SelectionModeHeader.tsx
import React from "react";
import { Paper, Box, Typography, Button } from "@mui/material";
import { SelectAll, Delete } from "@mui/icons-material";

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

interface SelectionModeHeaderProps {
  selectedProducts: string[];
  filteredProducts: Product[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<string[]>>;
  handleOpenDialog: () => void;
}

const SelectionModeHeader: React.FC<SelectionModeHeaderProps> = ({
  selectedProducts,
  filteredProducts,
  setSelectedProducts,
  handleOpenDialog,
}) => {
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p._id));
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: "primary.50" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          {selectedProducts.length} selected
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleSelectAll}
            startIcon={<SelectAll />}
            size="small"
          >
            {selectedProducts.length === filteredProducts.length ? "Deselect All" : "Select All"}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleOpenDialog}
            startIcon={<Delete />}
            size="small"
            disabled={selectedProducts.length === 0}
          >
            Delete
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default SelectionModeHeader;