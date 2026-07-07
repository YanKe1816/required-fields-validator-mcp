type JsonRpcId = string | number | null;

type JsonObject = Record<string, unknown>;

type ValidationErrorCode =
  | "missing_required_input"
  | "invalid_input_type"
  | "empty_input"
  | "out_of_scope"
  | "internal_error";

type ValidationError = {
  code: ValidationErrorCode;
  message: string;
  field: string;
};

type ValidationResult = {
  status: "success" | "error";
  is_complete: boolean;
  missing_fields: string[];
  present_fields: string[];
  source_label: string;
  errors: ValidationError[];
};

type ToolCallResult = {
  structuredContent: ValidationResult;
  content: Array<{
    type: "text";
    text: string;
  }>;
};

type Env = {
  OPENAI_APPS_CHALLENGE?: string;
};

const APP_NAME = "Required Fields Validator";
const APP_SLUG = "required-fields-validator";
const TOOL_NAME = "validate_required_fields";
const SUPPORT_EMAIL = "sidcraigau@gmail.com";
const PROTOCOL_VERSION = "2024-11-05";

const inputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    submitted_fields: {
      type: "object",
      description:
        "Fields already provided by the user. Keys are field names and values are submitted values.",
      additionalProperties: true,
    },
    required_fields: {
      type: "array",
      description: "List of required field names that must be present in submitted_fields.",
      items: {
        type: "string",
      },
    },
    source_label: {
      type: "string",
      description: "Optional label for the source form or workflow.",
    },
  },
  required: ["submitted_fields", "required_fields"],
} as const;

const outputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: {
      type: "string",
      enum: ["success", "error"],
    },
    is_complete: {
      type: "boolean",
    },
    missing_fields: {
      type: "array",
      items: {
        type: "string",
      },
    },
    present_fields: {
      type: "array",
      items: {
        type: "string",
      },
    },
    source_label: {
      type: "string",
    },
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: {
            type: "string",
            enum: [
              "missing_required_input",
              "invalid_input_type",
              "empty_input",
              "out_of_scope",
              "internal_error",
            ],
          },
          message: {
            type: "string",
          },
          field: {
            type: "string",
          },
        },
        required: ["code", "message"],
      },
    },
  },
  required: [
    "status",
    "is_complete",
    "missing_fields",
    "present_fields",
    "source_label",
    "errors",
  ],
} as const;

const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const toolDefinition = {
  name: TOOL_NAME,
  title: "Validate Required Fields",
  description:
    "Check whether the submitted fields include all required fields and return a structured validation result.",
  inputSchema,
  outputSchema,
  annotations,
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

function page(title: string, content: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} - ${APP_NAME}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #1d2838;
        background: #f7f8fb;
      }
      body {
        margin: 0;
      }
      header {
        border-bottom: 1px solid #d9dee8;
        background: #ffffff;
      }
      nav {
        max-width: 960px;
        margin: 0 auto;
        padding: 16px 20px;
        display: flex;
        gap: 18px;
        align-items: center;
        flex-wrap: wrap;
      }
      nav strong {
        margin-right: auto;
        color: #102033;
      }
      nav a {
        color: #2251a3;
        text-decoration: none;
        font-weight: 600;
      }
      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 40px 20px 56px;
      }
      section {
        margin-top: 28px;
      }
      h1 {
        font-size: 36px;
        line-height: 1.15;
        margin: 0 0 12px;
        color: #102033;
      }
      h2 {
        font-size: 22px;
        margin: 0 0 10px;
        color: #102033;
      }
      p, li {
        line-height: 1.65;
        font-size: 16px;
      }
      code {
        background: #eef2f8;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .lede {
        font-size: 18px;
        max-width: 760px;
      }
    </style>
  </head>
  <body>
    <header>
      <nav aria-label="Primary navigation">
        <strong>${APP_NAME}</strong>
        <a href="/">Home</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/support">Support</a>
      </nav>
    </header>
    <main>
      ${content}
    </main>
  </body>
</html>`;
}

function homePage(): string {
  return page(
    "Home",
    `<h1>${APP_NAME}</h1>
      <p class="lede">Checks whether submitted fields include required fields and returns a structured validation result.</p>

      <section>
        <h2>What this app does</h2>
        <p>This app checks field completeness by comparing provided field names with a required field list.</p>
      </section>

      <section>
        <h2>When ChatGPT should use it</h2>
        <p>ChatGPT should use this app when a user needs to confirm whether required fields are missing from submitted data.</p>
      </section>

      <section>
        <h2>What input it accepts</h2>
        <ul>
          <li><code>submitted_fields</code></li>
          <li><code>required_fields</code></li>
          <li><code>source_label</code></li>
        </ul>
      </section>

      <section>
        <h2>What output it returns</h2>
        <ul>
          <li><code>status</code></li>
          <li><code>is_complete</code></li>
          <li><code>missing_fields</code></li>
          <li><code>present_fields</code></li>
          <li><code>source_label</code></li>
          <li><code>errors</code></li>
        </ul>
      </section>

      <section>
        <h2>Available tools</h2>
        <p><strong>Tool name:</strong> <code>validate_required_fields</code></p>
        <p><strong>Tool title:</strong> Validate Required Fields</p>
        <p><strong>Purpose:</strong> Check whether submitted fields include all required fields and return a structured validation result.</p>
      </section>

      <section>
        <h2>MCP endpoint</h2>
        <p><code>POST /mcp</code></p>
      </section>

      <section>
        <h2>What this app does not do</h2>
        <ul>
          <li>Does not submit forms.</li>
          <li>Does not approve requests.</li>
          <li>Does not send emails.</li>
          <li>Does not update external systems.</li>
          <li>Does not call external APIs.</li>
          <li>Does not store long-term state.</li>
          <li>Does not require login.</li>
          <li>Does not make final decisions for users.</li>
          <li>Does not provide open-ended professional advice.</li>
        </ul>
      </section>

      <section>
        <h2>Data handling</h2>
        <p>Inputs are processed for the current request and are not stored as long-term data by this app.</p>
      </section>

      <section>
        <h2>Support</h2>
        <p>For support, visit the <a href="/support">Support</a> page.</p>
      </section>`,
  );
}

function privacyPage(): string {
  return page(
    "Privacy",
    `<h1>Privacy</h1>
      <section>
        <h2>Data collected</h2>
        <p>The app receives tool inputs supplied for the current request, including submitted field data, required field names, and an optional source label.</p>
      </section>
      <section>
        <h2>How input is used</h2>
        <p>Tool inputs are used only to generate the requested structured output for the current request.</p>
      </section>
      <section>
        <h2>How output is generated</h2>
        <p>The app compares required field names against submitted field keys and returns deterministic structured output.</p>
      </section>
      <section>
        <h2>Retention</h2>
        <p>This app does not store user input after the request is processed.</p>
      </section>
      <section>
        <h2>External sharing</h2>
        <p>The app does not sell user data and does not share tool input with external services.</p>
      </section>
      <section>
        <h2>External API policy</h2>
        <p>The app does not call external APIs.</p>
      </section>
      <section>
        <h2>Account/login policy</h2>
        <p>The app does not create a user account database and does not require login, OAuth, or API keys.</p>
      </section>
      <section>
        <h2>User controls</h2>
        <p>Users control what field data they provide in each request.</p>
      </section>
      <section>
        <h2>Read-only boundary</h2>
        <p>The app is read-only and does not modify external systems.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Privacy questions can be sent to <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
      </section>
      <section>
        <h2>Last updated</h2>
        <p>July 7, 2026</p>
      </section>`,
  );
}

function termsPage(): string {
  return page(
    "Terms",
    `<h1>Terms</h1>
      <section>
        <h2>Service description</h2>
        <p>This app provides read-only MCP tools that help ChatGPT produce structured outputs for the stated use case.</p>
      </section>
      <section>
        <h2>Allowed use</h2>
        <p>Use this app to check whether submitted field data includes required field names.</p>
      </section>
      <section>
        <h2>User responsibility</h2>
        <p>Users are responsible for reviewing outputs and deciding how to use them.</p>
      </section>
      <section>
        <h2>Limitations</h2>
        <p>This app only validates field presence according to the supplied input.</p>
      </section>
      <section>
        <h2>No external execution</h2>
        <p>This app does not send, submit, approve, publish, schedule, purchase, transfer, delete, or modify anything in external systems.</p>
      </section>
      <section>
        <h2>No professional advice unless explicitly scoped</h2>
        <p>The app does not provide open-ended professional advice.</p>
      </section>
      <section>
        <h2>No destructive actions</h2>
        <p>The app is read-only and performs no destructive actions.</p>
      </section>
      <section>
        <h2>No guarantees</h2>
        <p>This app does not guarantee approval, compliance, business outcomes, or error-free results.</p>
      </section>
      <section>
        <h2>Prohibited use</h2>
        <p>Do not use this app to automate external actions or make final decisions without review.</p>
      </section>
      <section>
        <h2>Changes to service</h2>
        <p>The service may be updated while preserving its stated read-only boundary.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions can be sent to <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
      </section>
      <section>
        <h2>Last updated</h2>
        <p>July 7, 2026</p>
      </section>`,
  );
}

function supportPage(): string {
  return page(
    "Support",
    `<h1>Support</h1>
      <section>
        <h2>Support email</h2>
        <p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
      </section>
      <section>
        <h2>Contact information requirements</h2>
        <p>Please include the app name, the route or MCP method involved, a brief description of the issue, and any non-sensitive example input needed to reproduce the problem.</p>
      </section>
      <section>
        <h2>Support scope</h2>
        <p>Support covers access to the review pages, challenge route, health route, and read-only MCP validation behavior.</p>
      </section>
      <section>
        <h2>Non-support scope</h2>
        <p>Support does not cover form submission, approvals, email delivery, account management, or changes in external systems.</p>
      </section>
      <section>
        <h2>Data/privacy questions</h2>
        <p>Data and privacy questions can be sent to the support email above.</p>
      </section>
      <section>
        <h2>App boundary reminder</h2>
        <p>This app checks required field completeness only. It remains read-only and does not call external APIs.</p>
      </section>`,
  );
}

function errorResult(code: ValidationErrorCode, message: string, field?: string): ValidationResult {
  return {
    status: "error",
    is_complete: false,
    missing_fields: [],
    present_fields: [],
    source_label: "",
    errors: [
      {
        code,
        message,
        field: field ?? "",
      },
    ],
  };
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasSubmittedValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return true;
}

function looksOutOfScope(text: string): boolean {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (normalized.length === 0) {
    return false;
  }

  return (
    /\b(after validation|please|pls|kindly|can you|could you|would you|then|and)\b.{0,80}\b(submit|approve|contact|send|update|delete|modify|decide)\b/i.test(
      normalized,
    ) ||
    /\b(submit|approve|contact|send|update|delete|modify|decide)\b.{0,80}\b(the|this|that|form|request|customer|user|system|record|external|database|email|message|data)\b/i.test(
      normalized,
    ) ||
    /\b(send)\b.{0,80}\b(to|email|message|customer|user)\b/i.test(normalized) ||
    /\b(update|delete|modify)\b.{0,80}\b(system|record|database|data|external)\b/i.test(normalized)
  );
}

function containsOutOfScopeRequest(value: unknown): boolean {
  if (typeof value === "string") {
    return looksOutOfScope(value);
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsOutOfScopeRequest(item));
  }

  if (isPlainObject(value)) {
    return Object.values(value).some((item) => containsOutOfScopeRequest(item));
  }

  return false;
}

function validateRequiredFields(argumentsValue: unknown): ValidationResult {
  if (containsOutOfScopeRequest(argumentsValue)) {
    return errorResult(
      "out_of_scope",
      "This tool only validates required fields and does not perform external actions.",
    );
  }

  if (!isPlainObject(argumentsValue)) {
    return errorResult("invalid_input_type", "Tool arguments must be an object.");
  }

  const submittedFields = argumentsValue.submitted_fields;
  const requiredFields = argumentsValue.required_fields;
  const sourceLabel = argumentsValue.source_label;

  if (submittedFields === undefined) {
    return errorResult("missing_required_input", "submitted_fields is required.", "submitted_fields");
  }

  if (requiredFields === undefined) {
    return errorResult("missing_required_input", "required_fields is required.", "required_fields");
  }

  if (!isPlainObject(submittedFields)) {
    return errorResult("invalid_input_type", "submitted_fields must be an object.", "submitted_fields");
  }

  if (!Array.isArray(requiredFields) || !requiredFields.every((field) => typeof field === "string")) {
    return errorResult(
      "invalid_input_type",
      "required_fields must be an array of strings.",
      "required_fields",
    );
  }

  if (requiredFields.length === 0) {
    return errorResult("empty_input", "required_fields must contain at least one field.", "required_fields");
  }

  if (sourceLabel !== undefined && typeof sourceLabel !== "string") {
    return errorResult("invalid_input_type", "source_label must be a string.", "source_label");
  }

  const presentFields: string[] = [];
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (field.trim().length === 0) {
      return errorResult("empty_input", "required_fields cannot include empty field names.", "required_fields");
    }

    if (Object.hasOwn(submittedFields, field) && hasSubmittedValue(submittedFields[field])) {
      presentFields.push(field);
    } else {
      missingFields.push(field);
    }
  }

  return {
    status: "success",
    is_complete: missingFields.length === 0,
    missing_fields: missingFields,
    present_fields: presentFields,
    source_label: sourceLabel ?? "",
    errors: [],
  };
}

function jsonRpcResponse(id: JsonRpcId, result: unknown): Response {
  return jsonResponse({
    jsonrpc: "2.0",
    id,
    result,
  });
}

function jsonRpcError(id: JsonRpcId, code: number, message: string): Response {
  return jsonResponse({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
    },
  });
}

function toolCallResult(result: ValidationResult): ToolCallResult {
  return {
    structuredContent: result,
    content: [
      {
        type: "text",
        text: JSON.stringify(result),
      },
    ],
  };
}

async function handleMcp(request: Request): Promise<Response> {
  let payload: JsonObject;

  try {
    const parsed = await request.json();
    if (!isPlainObject(parsed)) {
      return jsonRpcError(null, -32600, "Invalid JSON-RPC request.");
    }
    payload = parsed;
  } catch {
    return jsonRpcError(null, -32700, "Parse error.");
  }

  const id = (payload.id ?? null) as JsonRpcId;
  const method = payload.method;

  if (typeof method !== "string") {
    return jsonRpcError(id, -32600, "JSON-RPC method is required.");
  }

  if (method === "initialize") {
    return jsonRpcResponse(id, {
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: {
        name: APP_SLUG,
        version: "1.0.0",
      },
      capabilities: {
        tools: {},
      },
    });
  }

  if (method === "tools/list") {
    return jsonRpcResponse(id, {
      tools: [toolDefinition],
    });
  }

  if (method === "tools/call") {
    const params = isPlainObject(payload.params) ? payload.params : {};
    const name = params.name;

    if (name !== TOOL_NAME) {
      return jsonRpcResponse(
        id,
        toolCallResult(errorResult("out_of_scope", "Unknown or unsupported tool name.", "name")),
      );
    }

    try {
      return jsonRpcResponse(id, toolCallResult(validateRequiredFields(params.arguments)));
    } catch {
      return jsonRpcResponse(id, toolCallResult(errorResult("internal_error", "Internal validation error.")));
    }
  }

  return jsonRpcError(id, -32601, "Method not found.");
}

export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return htmlResponse(homePage());
    }

    if (request.method === "GET" && url.pathname === "/privacy") {
      return htmlResponse(privacyPage());
    }

    if (request.method === "GET" && url.pathname === "/terms") {
      return htmlResponse(termsPage());
    }

    if (request.method === "GET" && url.pathname === "/support") {
      return htmlResponse(supportPage());
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({
        status: "ok",
        app: APP_NAME,
      });
    }

    if (request.method === "GET" && url.pathname === "/.well-known/openai-apps-challenge") {
      return textResponse(env.OPENAI_APPS_CHALLENGE ?? "");
    }

    if (request.method === "POST" && url.pathname === "/mcp") {
      return handleMcp(request);
    }

    return jsonResponse(
      {
        error: "not_found",
      },
      404,
    );
  },
};
