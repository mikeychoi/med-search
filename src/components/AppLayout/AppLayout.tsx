import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import MenuIcon from '@mui/icons-material/Menu';
import NavSidebar, { NAV_SIDEBAR_ID } from '../NavSidebar/NavSidebar';

function AppLayout() {
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'), { noSsr: true });
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarOpen = isDesktop ? desktopExpanded : mobileOpen;

  const toggleSidebar = () => {
    if (isDesktop) {
      setDesktopExpanded((expanded) => !expanded);
    } else {
      setMobileOpen((open) => !open);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Toggle navigation"
            aria-controls={NAV_SIDEBAR_ID}
            aria-expanded={sidebarOpen}
            onClick={toggleSidebar}
          >
            <MenuIcon />
          </IconButton>
          <LocalPharmacyIcon aria-hidden />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            MedSearch
          </Typography>
        </Toolbar>
      </AppBar>
      <NavSidebar
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={sidebarOpen}
        onClose={() => setMobileOpen(false)}
      />
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        {/* Spacer so content starts below the fixed AppBar. */}
        <Toolbar />
        <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}

export default AppLayout;
