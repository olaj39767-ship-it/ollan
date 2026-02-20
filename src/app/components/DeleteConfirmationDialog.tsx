// src/components/DeleteConfirmationDialog.tsx
import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from "@mui/material";

interface DeleteConfirmationDialogProps {
  openDialog: boolean;
  selectedProducts: string[];
  handleCloseDialog: () => void;
  handleConfirmDelete: () => void;
  handleDelete: () => Promise<void>;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  openDialog,
  selectedProducts,
  handleCloseDialog,
  handleConfirmDelete,
}) => {
  return (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete {selectedProducts.length} selected product(s)? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleConfirmDelete} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;