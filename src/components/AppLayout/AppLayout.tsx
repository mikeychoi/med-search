import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';

const navItems = [
  { label: 'Search', path: '/' },
  { label: 'Lists', path: '/lists' },
];

function AppLayout() {
  const { pathname } = useLocation();
  const activePath = navItems.find((item) => item.path === pathname)?.path ?? false;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 2 }}>
          <LocalPharmacyIcon aria-hidden />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, flexGrow: 1 }}>
            MedSearch
          </Typography>
          <Tabs
            component="nav"
            aria-label="Main navigation"
            value={activePath}
            textColor="inherit"
            slotProps={{ indicator: { sx: { bgcolor: 'common.white' } } }}
          >
            {navItems.map((item) => (
              <Tab
                key={item.path}
                label={item.label}
                value={item.path}
                component={RouterLink}
                to={item.path}
                sx={{ minWidth: { xs: 72, sm: 96 } }}
              />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}

export default AppLayout;
