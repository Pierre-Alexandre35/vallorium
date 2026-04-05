import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    primary: {
      main: '#2f5f8f',
    },
    background: {
      default: '#f5f7fb',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
  },
});
