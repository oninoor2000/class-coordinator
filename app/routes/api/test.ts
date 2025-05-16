import { rateLimit } from "@/utils/api-rate-limiter";
import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { z } from "zod";

// Rate limiter
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export const APIRoute = createAPIFileRoute("/api/test")({
  GET: async ({ request, params }) => {
    try {
      await limiter.check(request, 60); // 60 requests per minute

      // Add a 3-second delay to simulate loading
      await new Promise((resolve) => setTimeout(resolve, 3000));

      return json({
        message:
          "A modern TypeScript starter template for building web applications",
      });
    } catch (error) {
      console.error("Error fetching events:", error);

      if (error instanceof Error && error.message === "Rate limit exceeded") {
        return json(
          { error: "Too many requests, please try again later" },
          { status: 429 }
        );
      }

      if (error instanceof z.ZodError) {
        return json(
          {
            error: "Invalid query parameters: " + JSON.stringify(error.errors),
          },
          { status: 400 }
        );
      }

      return json(
        { error: "An unexpected error occurred while processing your request" },
        { status: 500 }
      );
    }
  },
});
