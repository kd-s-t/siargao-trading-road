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
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { AuditLog } from '@/lib/audit_logs';

interface AuditLogsTableProps {
  auditLogs: AuditLog[];
}

function getStatusColor(statusCode: number): 'success' | 'error' | 'warning' | 'default' {
  if (statusCode >= 200 && statusCode < 300) return 'success';
  if (statusCode >= 400 && statusCode < 500) return 'warning';
  if (statusCode >= 500) return 'error';
  return 'default';
}

function getMethodColor(method: string): 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default' {
  switch (method) {
    case 'GET':
      return 'primary';
    case 'POST':
      return 'success';
    case 'PUT':
      return 'warning';
    case 'DELETE':
      return 'error';
    default:
      return 'default';
  }
}

function Row({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);

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
        <TableCell>{log.id}</TableCell>
        <TableCell>
          {log.user ? (
            <Box>
              <Typography variant="body2">{log.user.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {log.user.email}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Anonymous
            </Typography>
          )}
        </TableCell>
        <TableCell>
          {log.role && (
            <Chip label={log.role} size="small" color="primary" />
          )}
        </TableCell>
        <TableCell>
          <Chip
            label={log.method}
            size="small"
            color={getMethodColor(log.method)}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {log.endpoint}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={log.status_code}
            size="small"
            color={getStatusColor(log.status_code)}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2">{log.duration_ms}ms</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {new Date(log.created_at).toLocaleString()}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">IP Address:</Typography>
                <Typography variant="body2">{log.ip_address}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">User Agent:</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                  {log.user_agent}
                </Typography>
              </Box>
              {log.request_body && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Request Body:</Typography>
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
                    {log.request_body}
                  </Box>
                </Box>
              )}
              {log.response_body && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Response Body:</Typography>
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
                    {log.response_body}
                  </Box>
                </Box>
              )}
              {log.error_message && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error">Error:</Typography>
                  <Typography variant="body2" color="error">
                    {log.error_message}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function AuditLogsTable({ auditLogs }: AuditLogsTableProps) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>ID</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Method</TableCell>
            <TableCell>Endpoint</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Timestamp</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {auditLogs.map((log) => (
            <Row key={log.id} log={log} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

