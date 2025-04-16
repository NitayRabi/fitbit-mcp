# Fitbit MCP (Model Context Protocol)

A Model Context Protocol (MCP) implementation for Fitbit, enabling AI assistants to access and analyze your Fitbit health and fitness data.

## Usage

```bash
npm install -g fitbit-mcp
```

## Usage

For JSON configuration (for use with AI assistant frameworks):

```json
{
  "command": "npx",
  "args": ["-y", "fitbit-mcp", "--stdio"],
  "env": {
    "FITBIT_ACCESS_TOKEN": "YOUR_FITBIT_ACCESS_TOKEN"
  }
}
```

Or with arguments instead of environment variables:

```json
{
  "command": "npx",
  "args": ["-y", "fitbit-mcp", "--stdio", "--fitbit-token=YOUR_FITBIT_ACCESS_TOKEN"]
}
```

## Available Tools

This MCP provides the following tools for AI assistants to access your Fitbit data:

- **getUserProfile**: Get your Fitbit profile information
- **getActivities**: Get activity data for a specified date
- **getSleepLogs**: Get sleep data for a specified date
- **getHeartRate**: Get heart rate data for a specified date and period
- **getSteps**: Get step count for a specified date and period
- **getBodyMeasurements**: Get weight and body fat data
- **getFoodLogs**: Get food log data for a specified date
- **getWaterLogs**: Get water consumption data for a specified date
- **getLifetimeStats**: Get lifetime activity statistics
- **getUserSettings**: Get user settings and preferences
- **getFloorsClimbed**: Get floors climbed data
- **getDistance**: Get distance data
- **getCalories**: Get calories burned data
- **getActiveZoneMinutes**: Get active zone minutes data
- **getDevices**: Get information about connected Fitbit devices
- **getBadges**: Get earned badges and achievements

Most tools accept optional parameters:
- `date`: Date in YYYY-MM-DD format (defaults to today)
- `period`: Time period for data (1d, 7d, 30d, 1w, 1m)

## Obtaining a Fitbit Access Token

To get a Fitbit access token:

1. Create an application at [Fitbit Developer Portal](https://dev.fitbit.com/apps/new)
2. Set OAuth 2.0 Application Type to "Personal"
3. Set Callback URL to "http://localhost:3000"
4. After creating the application, note your Client ID and Client Secret
5. Use the OAuth 2.0 authorization flow to obtain an access token

For detailed instructions on OAuth authentication, see the [Fitbit API Documentation](https://dev.fitbit.com/build/reference/web-api/oauth2/).

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Every pull request triggers a GitHub Actions workflow that verifies the build process.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/fitbit-mcp.git
cd fitbit-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Release Process

To publish a new version to NPM:

1. Update the version in `package.json`
2. Create a new GitHub release with a tag like `v1.0.1`
3. The GitHub Actions workflow will automatically build and publish the package to NPM

Make sure you have the `NPM_TOKEN` secret configured in your GitHub repository settings.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
