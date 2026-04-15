"use client";

import { Box, Typography, Paper, Alert } from "@mui/material";

export default function SettingsPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Settings management feature is coming soon!
        </Alert>

        <Typography variant="body1" color="textSecondary">
          This section will allow you to:
        </Typography>
        <Box component="ul" sx={{ mt: 2, pl: 3 }}>
          <Typography component="li" variant="body2" color="textSecondary">
            Configure system settings
          </Typography>
          <Typography component="li" variant="body2" color="textSecondary">
            Manage user permissions
          </Typography>
          <Typography component="li" variant="body2" color="textSecondary">
            Set up notifications
          </Typography>
          <Typography component="li" variant="body2" color="textSecondary">
            Configure email templates
          </Typography>
          <Typography component="li" variant="body2" color="textSecondary">
            Manage API integrations
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
