import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a3a5f',
      light: '#2c5282',
      dark: '#0f2538',
    },
    secondary: {
      main: '#38b2ac',
      light: '#4fd1c7',
      dark: '#2c9aa0',
    },
  },
});

export default theme;

