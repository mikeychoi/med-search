import { useState, type SubmitEvent } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  /** Called with the trimmed query when the user submits a non-empty search. */
  onSearch: (query: string) => void;
  /** While true, the search button is disabled and further submissions are ignored. */
  loading?: boolean;
}

function SearchBar({ onSearch, loading = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || !trimmedQuery) return;
    onSearch(trimmedQuery);
  };

  return (
    <Stack
      component="form"
      role="search"
      onSubmit={handleSubmit}
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
    >
      <TextField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for medications…"
        fullWidth
        autoComplete="off"
        slotProps={{
          htmlInput: { 'aria-label': 'Search medications' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={loading || !trimmedQuery}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
        sx={{ flexShrink: 0, minWidth: 120 }}
      >
        {loading ? 'Searching…' : 'Search'}
      </Button>
    </Stack>
  );
}

export default SearchBar;
