import { NavLink, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import type { Theme } from '@mui/material/styles';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SearchIcon from '@mui/icons-material/Search';

export const NAV_SIDEBAR_ID = 'nav-sidebar';

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

const navItems = [
  { label: 'Search', path: '/', icon: <SearchIcon /> },
  { label: 'Lists', path: '/lists', icon: <ListAltIcon /> },
];

interface NavSidebarProps {
  /** `permanent` sits beside the content (desktop); `temporary` overlays it (mobile). */
  variant: 'permanent' | 'temporary';
  /** Permanent: expanded vs. collapsed to icons. Temporary: shown vs. hidden. */
  open: boolean;
  onClose: () => void;
}

function NavSidebar({ variant, open, onClose }: NavSidebarProps) {
  const { pathname } = useLocation();
  const isPermanent = variant === 'permanent';
  const collapsed = isPermanent && !open;
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const widthTransition = (theme: Theme) =>
    theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: open
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    });

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{ width, flexShrink: 0, transition: widthTransition }}
      slotProps={{
        paper: {
          sx: {
            width,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            whiteSpace: 'nowrap',
            transition: widthTransition,
          },
        },
      }}
    >
      {/* Spacer so the list starts below the fixed AppBar. */}
      <Toolbar />
      <List component="nav" id={NAV_SIDEBAR_ID} aria-label="Main navigation">
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <Tooltip title={collapsed ? item.label : ''} placement="right">
              <ListItemButton
                component={NavLink}
                to={item.path}
                end
                selected={pathname === item.path}
                onClick={isPermanent ? undefined : onClose}
                sx={{ minHeight: 48, px: 2.5, justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {/* Kept in the DOM when collapsed so links retain an accessible name. */}
                <ListItemText primary={item.label} sx={{ opacity: collapsed ? 0 : 1 }} />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default NavSidebar;
