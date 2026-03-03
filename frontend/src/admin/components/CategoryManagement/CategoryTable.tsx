// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\components\CategoryManagement\CategoryTable.tsx
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  Chip,
  Avatar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Category } from "../../../types/categoryTypes";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  level: number;
  parentCategories?: Category[];
}

const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  onEdit,
  onDelete,
  level,
  parentCategories = [],
}) => {
  const getParentCategoryName = (parentId: string | null) => {
    if (!parentId) return "Root Category";
    const parent = parentCategories.find(p => p._id === parentId);
    return parent ? parent.name : "Parent not found";
  };

  const uniqueCategories = React.useMemo(() => {
    const seen = new Set<string>();
    return categories.filter(cat => {
      if (seen.has(cat._id)) {
        console.warn(`Duplicate category found: ${cat._id}, ${cat.name}`);
        return false;
      }
      seen.add(cat._id);
      return true;
    });
  }, [categories]);

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700 }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell>No</StyledTableCell>
            {/* ✅ NEW: Show Order column for Level 1 & 2 */}
            {level <= 2 && <StyledTableCell>Order</StyledTableCell>}
            {/* ✅ Show Image column for Level 1 */}
            {level === 1 && <StyledTableCell>Image</StyledTableCell>}
            <StyledTableCell>Name</StyledTableCell>
            <StyledTableCell>Category ID</StyledTableCell>
            <StyledTableCell>Level</StyledTableCell>
            <StyledTableCell>Parent Category</StyledTableCell>
            <StyledTableCell align="right">Actions</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {uniqueCategories.length === 0 ? (
            <StyledTableRow>
              <StyledTableCell 
                colSpan={level === 1 ? 8 : level <= 2 ? 7 : 6} 
                align="center"
              >
                <Typography variant="body1" color="text.secondary">
                  No categories found
                </Typography>
              </StyledTableCell>
            </StyledTableRow>
          ) : (
            uniqueCategories.map((category, index) => (
              <StyledTableRow key={category._id}>
                <StyledTableCell component="th" scope="row">
                  {index + 1}
                </StyledTableCell>
                
                {/* ✅ NEW: Show Order Number for Level 1 & 2 */}
                {level <= 2 && (
                  <StyledTableCell>
                    <Chip
                      label={category.order || 'N/A'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </StyledTableCell>
                )}
                
                {/* ✅ Show Image for Level 1 categories */}
                {level === 1 && (
                  <StyledTableCell>
                    {category.image ? (
                      <Avatar
                        src={category.image}
                        alt={category.name}
                        sx={{ width: 50, height: 50 }}
                      />
                    ) : (
                      <Avatar
                        sx={{ 
                          width: 50, 
                          height: 50,
                          bgcolor: 'grey.300',
                          color: 'grey.600'
                        }}
                      >
                        {category.name?.charAt(0) || '?'}
                      </Avatar>
                    )}
                  </StyledTableCell>
                )}

                <StyledTableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {category.name}
                    <Chip
                      label={`Level ${category.level}`}
                      size="small"
                      color={category.level === 1 ? "primary" : category.level === 2 ? "secondary" : "default"}
                    />
                  </Box>
                </StyledTableCell>
                <StyledTableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: "grey.100",
                      p: 0.5,
                      borderRadius: 1,
                      fontFamily: "monospace",
                    }}
                  >
                    {category.categoryId}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell>
                  <Chip label={category.level} color="info" size="small" />
                </StyledTableCell>
                <StyledTableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {getParentCategoryName(category.parentCategory)}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell align="right">
                  <IconButton
                    onClick={() => onEdit(category)}
                    color="primary"
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(category)}
                    color="error"
                    title="Delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </StyledTableCell>
              </StyledTableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CategoryTable;