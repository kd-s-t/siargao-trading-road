import { useState, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Typography,
  Collapse,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { BugReport } from '@/lib/bugs';

interface BugsTableProps {
  bugs: BugReport[];
  onUpdate: (id: number, updates: { status?: string; notes?: string }) => Promise<void>;
}

function getStatusColor(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  switch (status) {
    case 'open':
      return 'error';
    case 'investigating':
      return 'warning';
    case 'fixed':
      return 'info';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
}

function Row({ bug, onUpdate }: { bug: BugReport; onUpdate: (id: number, updates: { status?: string; notes?: string }) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(bug.status);
  const [notes, setNotes] = useState(bug.notes || '');
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const prevBugRef = useRef(bug);

  // Update state when bug prop changes
  if (prevBugRef.current !== bug) {
    prevBugRef.current = bug;
    setStatus(bug.status);
    setNotes(bug.notes || '');
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus as BugReport['status']);
    await onUpdate(bug.id, { status: newStatus });
  };

  const handleSaveNotes = async () => {
    await onUpdate(bug.id, { notes });
    setNotesDialogOpen(false);
  };

  return (
    <>
      <TableRow
        component={motion.tr}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        sx={{ '& > *': { borderBottom: 'unset' } }}
      >
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{bug.id}</TableCell>
        <TableCell>
          {bug.user ? (
            <Box>
              <Typography variant="body2">{bug.user.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {bug.user.email}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Anonymous
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Chip label={bug.platform} size="small" color="primary" />
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {bug.title}
          </Typography>
        </TableCell>
        <TableCell>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              size="small"
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="investigating">Investigating</MenuItem>
              <MenuItem value="fixed">Fixed</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
        </TableCell>
        <TableCell>
          <Chip
            label={status}
            size="small"
            color={getStatusColor(status)}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {new Date(bug.created_at).toLocaleString()}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Description:</Typography>
                <Typography variant="body2">{bug.description}</Typography>
              </Box>
              {bug.error_type && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Error Type:</Typography>
                  <Typography variant="body2">{bug.error_type}</Typography>
                </Box>
              )}
              {bug.stack_trace && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Stack Trace:</Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 1,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 200,
                      fontSize: '0.75rem',
                    }}
                  >
                    {bug.stack_trace}
                  </Box>
                </Box>
              )}
              {bug.device_info && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Device Info:</Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 1,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 150,
                      fontSize: '0.75rem',
                    }}
                  >
                    {bug.device_info}
                  </Box>
                </Box>
              )}
              {bug.app_version && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">App Version:</Typography>
                  <Typography variant="body2">{bug.app_version}</Typography>
                </Box>
              )}
              {bug.os_version && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">OS Version:</Typography>
                  <Typography variant="body2">{bug.os_version}</Typography>
                </Box>
              )}
              {bug.notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Notes:</Typography>
                  <Typography variant="body2">{bug.notes}</Typography>
                </Box>
              )}
              {bug.resolved_by_user && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Resolved By:</Typography>
                  <Typography variant="body2">{bug.resolved_by_user.name}</Typography>
                </Box>
              )}
              {bug.resolved_at && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Resolved At:</Typography>
                  <Typography variant="body2">{new Date(bug.resolved_at).toLocaleString()}</Typography>
                </Box>
              )}
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setNotesDialogOpen(true)}
                >
                  {bug.notes ? 'Edit Notes' : 'Add Notes'}
                </Button>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      <Dialog open={notesDialogOpen} onClose={() => setNotesDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notes</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this bug..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNotes} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function BugsTable({ bugs, onUpdate }: BugsTableProps) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>ID</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Platform</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Status Badge</TableCell>
            <TableCell>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bugs.map((bug) => (
            <Row key={bug.id} bug={bug} onUpdate={onUpdate} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

