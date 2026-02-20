// src/components/SearchAndFilters.tsx
import React from "react";
import { Paper, Box, TextField, IconButton, Collapse, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import { Search, FilterList, Clear } from "@mui/icons-material";

interface SearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  filterCategory: string;
  setFilterCategory: React.Dispatch<React.SetStateAction<string>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  categories: string[];
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  showFilters,
  setShowFilters,
  categories,
}) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          size="small"
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
        />
        <IconButton onClick={() => setShowFilters(!showFilters)}>
          <FilterList />
        </IconButton>
      </Box>
      <Collapse in={showFilters}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              label="Category"
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm("");
              setFilterCategory("all");
            }}
            startIcon={<Clear />}
            size="small"
          >
            Clear
          </Button>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SearchAndFilters;