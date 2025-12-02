'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const steps = [
  {
    label: 'Welcome',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Welcome to Siargao Trading Road Admin Console
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This is your central hub for managing Siargao Trading Road. Let&apos;s get you started with the key features.
        </Typography>
      </Box>
    ),
  },
  {
    label: 'Manage Users',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Register Suppliers & Stores
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          As an admin, you can register new suppliers and stores in the system.
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <PeopleIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Go to Users page"
              secondary="Click 'Register User' to add new suppliers or stores"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="View User Details"
              secondary="Click on any user to see their analytics and order history"
            />
          </ListItem>
        </List>
      </Box>
    ),
  },
  {
    label: 'Manage Products',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          View & Manage Products
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Products are owned by suppliers. You can view all products and their details.
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <InventoryIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Browse Products"
              secondary="View all products, filter by supplier or category"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Product Details"
              secondary="See supplier information, pricing, and stock levels"
            />
          </ListItem>
        </List>
      </Box>
    ),
  },
  {
    label: 'Manage Orders',
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Track Orders
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Monitor all orders placed by stores from suppliers.
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <ShoppingCartIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="View All Orders"
              secondary="See order status, amounts, and details"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Order Details"
              secondary="Click 'View Details' to see full order information"
            />
          </ListItem>
        </List>
      </Box>
    ),
  },
];

export default function OnboardingDialog() {
  const [open, setOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasSeenOnboarding = localStorage.getItem('admin_onboarding_completed');
      return !hasSeenOnboarding;
    }
    return false;
  });
  const [activeStep, setActiveStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleComplete();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleComplete = () => {
    localStorage.setItem('admin_onboarding_completed', 'true');
    setOpen(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNavigate = (path: string) => {
    handleComplete();
    router.push(path);
  };

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5">Getting Started</Typography>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 4 }}>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 3, mb: 2, minHeight: 300 }}>
          {steps[activeStep].content}
        </Paper>

        {activeStep === 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => handleNavigate('/users')}
            >
              Go to Users Page
            </Button>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => handleNavigate('/products')}
            >
              Go to Products Page
            </Button>
          </Box>
        )}

        {activeStep === 3 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => handleNavigate('/orders')}
            >
              Go to Orders Page
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleSkip} color="inherit">
          Skip
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} sx={{ mr: 1 }}>
            Back
          </Button>
        )}
        <Button onClick={handleNext} variant="contained">
          {activeStep === steps.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

