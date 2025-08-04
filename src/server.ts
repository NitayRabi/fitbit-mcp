import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import minimist from "minimist";

// Define configuration schema
export const configSchema = z.object({
  fitbitToken: z.string().describe("Fitbit access token obtained from Fitbit Developer portal")
});

const VERSION = "1.0.0";
const baseUrl = "https://api.fitbit.com/1";

interface ServerConfig {
  fitbitToken: string;
}

export function initServer(config?: ServerConfig) {
  let accessToken: string;

  if (config) {
    // Smithery mode - use provided config
    accessToken = config.fitbitToken;
  } else {
    // STDIO mode - get token from command line or environment
    const argv = minimist(process.argv.slice(2));
    accessToken = argv["fitbit-token"] || process.env.FITBIT_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error(
        "Error: Fitbit access token is required. Provide it with --fitbit-token or FITBIT_ACCESS_TOKEN environment variable."
      );
      process.exit(1);
    }
  }

  // Create a new MCP server for Fitbit
  const server = new McpServer({
    name: "Fitbit MCP",
    version: VERSION,
  });

  // Helper function to make API requests
  async function makeApiRequest(endpoint: string): Promise<any> {
    try {
      const url = `${baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Fitbit API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error making request to ${endpoint}:`, error);
      throw error;
    }
  }

  // Helper function to format dates
  function formatDate(date?: string): string {
    if (date) return date;
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  // Register tool for getting user profile
  server.tool("getUserProfile", {}, async () => {
    try {
      const data = await makeApiRequest("/user/-/profile.json");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  // Register tool for getting activities
  server.tool(
    "getActivities",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format. If not specified, will use today."),
    },
    async ({ date }) => {
      try {
        const formattedDate = formatDate(date);
        // Use the correct endpoint format without period
        const endpoint = `/user/-/activities/date/${formattedDate}.json`;

        const data = await makeApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  date: formattedDate,
                  activities: data.activities || [],
                  summary: data.summary || {},
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool for getting sleep logs
  server.tool(
    "getSleepLogs",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format. If not specified, will use today."),
    },
    async ({ date }) => {
      try {
        const formattedDate = formatDate(date);
        // Remove period parameter which seems to be causing issues
        const endpoint = `/user/-/sleep/date/${formattedDate}.json`;

        const data = await makeApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  date: formattedDate,
                  sleep: data.sleep || [],
                  summary: data.summary || {},
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool for getting heart rate data
  server.tool(
    "getHeartRate",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format. If not specified, will use today."),
      period: z
        .string()
        .optional()
        .describe("Period for heart rate data: 1d, 7d, 30d"),
    },
    async ({ date, period }) => {
      try {
        const formattedDate = formatDate(date);
        let endpoint = "";

        if (period) {
          endpoint = `/user/-/activities/heart/date/${formattedDate}/${period}.json`;
        } else {
          endpoint = `/user/-/activities/heart/date/${formattedDate}/1d.json`;
        }

        const data = await makeApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  date: formattedDate,
                  heartRate: data["activities-heart"] || [],
                  intraday: data["activities-heart-intraday"] || {},
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool for getting step data
  server.tool(
    "getSteps",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format. If not specified, will use today."),
      period: z
        .string()
        .optional()
        .describe("Period for step data: 1d, 7d, 30d, 1w, 1m"),
    },
    async ({ date, period }) => {
      try {
        const formattedDate = formatDate(date);
        let endpoint = "";

        if (period) {
          endpoint = `/user/-/activities/steps/date/${formattedDate}/${period}.json`;
        } else {
          endpoint = `/user/-/activities/steps/date/${formattedDate}/1d.json`;
        }

        const data = await makeApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  date: formattedDate,
                  steps: data["activities-steps"] || [],
                  intraday: data["activities-steps-intraday"] || {},
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool for getting weight and body measurements
  server.tool(
    "getBodyMeasurements",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format. If not specified, will use today."),
      period: z
        .string()
        .optional()
        .describe("Period for body data: 1d, 7d, 30d, 1w, 1m"),
    },
    async ({ date, period }) => {
      try {
        const formattedDate = formatDate(date);
        let endpoint = "";

        if (period) {
          endpoint = `/user/-/body/log/weight/date/${formattedDate}/${period}.json`;
        } else {
          endpoint = `/user/-/body/log/weight/date/${formattedDate}.json`;
        }

        const weightData = await makeApiRequest(endpoint);

        // Also get body fat data
        let fatEndpoint = "";
        if (period) {
          fatEndpoint = `/user/-/body/log/fat/date/${formattedDate}/${period}.json`;
        } else {
          fatEndpoint = `/user/-/body/log/fat/date/${formattedDate}.json`;
        }

        const fatData = await makeApiRequest(fatEndpoint);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  date: formattedDate,
                  weight: weightData.weight || [],
                  fat: fatData.fat || [],
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool for getting food logs
  server.tool(
    "getFoodLogs",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format. If not specified, will use today."),
    },
    async ({ date }) => {
      try {
        const formattedDate = formatDate(date);
        const endpoint = `/user/-/foods/log/date/${formattedDate}.json`;

        const data = await makeApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  date: formattedDate,
                  meals: data.foods || [],
                  summary: data.summary || {},
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool for getting water logs
  server.tool(
    "getWaterLogs",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format. If not specified, will use today."),
    },
    async ({ date }) => {
      try {
        const formattedDate = formatDate(date);
        const endpoint = `/user/-/foods/log/water/date/${formattedDate}.json`;

        const data = await makeApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  date: formattedDate,
                  water: data.water || [],
                  summary: data.summary || {},
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool for getting lifetime stats
  server.tool("getLifetimeStats", {}, async () => {
    try {
      const endpoint = "/user/-/activities.json";
      const data = await makeApiRequest(endpoint);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                lifetime: data.lifetime || {},
                best: data.best || {},
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  // Register tool for getting settings
  server.tool("getUserSettings", {}, async () => {
    try {
      const endpoint = "/user/-/profile.json";
      const data = await makeApiRequest(endpoint);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                user: data.user || {},
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  // Register tool for getting floors climbed
  server.tool(
    "getFloorsClimbed",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format. If not specified, will use today."),
      period: z
        .string()
        .optional()
        .describe("Period for data: 1d, 7d, 30d, 1w, 1m"),
    },
    async ({ date, period }) => {
      try {
        const formattedDate = formatDate(date);
        let endpoint = "";

        if (period) {
          endpoint = `/user/-/activities/floors/date/${formattedDate}/${period}.json`;
        } else {
          endpoint = `/user/-/activities/floors/date/${formattedDate}/1d.json`;
        }

        const data = await makeApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  date: formattedDate,
                  floors: data["activities-floors"] || [],
                  intraday: data["activities-floors-intraday"] || {},
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool for getting distance data
  server.tool(
    "getDistance",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format. If not specified, will use today."),
      period: z
        .string()
        .optional()
        .describe("Period for data: 1d, 7d, 30d, 1w, 1m"),
    },
    async ({ date, period }) => {
      try {
        const formattedDate = formatDate(date);
        let endpoint = "";

        if (period) {
          endpoint = `/user/-/activities/distance/date/${formattedDate}/${period}.json`;
        } else {
          endpoint = `/user/-/activities/distance/date/${formattedDate}/1d.json`;
        }

        const data = await makeApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  date: formattedDate,
                  distance: data["activities-distance"] || [],
                  intraday: data["activities-distance-intraday"] || {},
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool for getting calories burned
  server.tool(
    "getCalories",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format. If not specified, will use today."),
      period: z
        .string()
        .optional()
        .describe("Period for data: 1d, 7d, 30d, 1w, 1m"),
    },
    async ({ date, period }) => {
      try {
        const formattedDate = formatDate(date);
        let endpoint = "";

        if (period) {
          endpoint = `/user/-/activities/calories/date/${formattedDate}/${period}.json`;
        } else {
          endpoint = `/user/-/activities/calories/date/${formattedDate}/1d.json`;
        }

        const data = await makeApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  date: formattedDate,
                  calories: data["activities-calories"] || [],
                  intraday: data["activities-calories-intraday"] || {},
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool for getting active zone minutes
  server.tool(
    "getActiveZoneMinutes",
    {
      date: z
        .string()
        .optional()
        .describe("Date in YYYY-MM-DD format. If not specified, will use today."),
      period: z
        .string()
        .optional()
        .describe("Period for data: 1d, 7d, 30d, 1w, 1m"),
    },
    async ({ date, period }) => {
      try {
        const formattedDate = formatDate(date);
        let endpoint = "";

        if (period) {
          endpoint = `/user/-/activities/active-zone-minutes/date/${formattedDate}/${period}.json`;
        } else {
          endpoint = `/user/-/activities/active-zone-minutes/date/${formattedDate}/1d.json`;
        }

        const data = await makeApiRequest(endpoint);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  date: formattedDate,
                  activeZones: data["activities-active-zone-minutes"] || [],
                  intraday: data["activities-active-zone-minutes-intraday"] || {},
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register tool for getting device information
  server.tool("getDevices", {}, async () => {
    try {
      const endpoint = "/user/-/devices.json";
      const data = await makeApiRequest(endpoint);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  // Register tool for getting badges/achievements
  server.tool("getBadges", {}, async () => {
    try {
      const endpoint = "/user/-/badges.json";
      const data = await makeApiRequest(endpoint);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  });

  return {
    // For Smithery HTTP mode
    smitheryServer: () => server.server,
    
    // For STDIO mode
    stdioServer: async () => {
      console.log("Fitbit MCP initialized successfully with provided token");
      
      // Create a StdioServerTransport and connect to it
      const transport = new StdioServerTransport();
      await server.connect(transport);
    }
  };
}