import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Extend the Chakra UI theme
const theme = extendTheme({
  colors: {
    brand: {
      50: '#f5f9ff',
      100: '#e6efff',
      200: '#bfd8ff',
      300: '#80abff',
      400: '#4d85ff',
      500: '#3366ff', // Primary brand color
      600: '#254ccc',
      700: '#1a3999',
      800: '#102566',
      900: '#051233',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
reportWebVitals();
