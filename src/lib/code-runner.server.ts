const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  javascript: 63,
  js: 63,
  java: 62,
  cpp: 54,
  "c++": 54,
  c: 50,
};

type CodeTestCase = {
  input: string;
  expectedOutput: string;
};

type Judge0Response = {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: {
    id?: number | string | null;
    description?: string | null;
  } | null;
};

async function runOne(code: string, language: string, stdin: string) {
  const languageId = JUDGE0_LANGUAGE_IDS[language] || JUDGE0_LANGUAGE_IDS.python;
  const res = await fetch("https://ce.judge0.com/submissions?base64_encoded=false&wait=true", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code: code,
      language_id: languageId,
      stdin,
      cpu_time_limit: 5,
      wall_time_limit: 10,
    }),
  });

  if (!res.ok) {
    return { stdout: "", stderr: `Runner error: HTTP ${res.status}`, exitCode: 1 };
  }

  const data = (await res.json()) as Judge0Response;
  const statusId = Number(data?.status?.id ?? 0);
  const out = data?.stdout ?? "";
  const err =
    data?.stderr ?? data?.compile_output ?? data?.message ?? data?.status?.description ?? "";
  return { stdout: out, stderr: err, exitCode: statusId === 3 ? 0 : statusId || 1 };
}

function normalize(s: string) {
  return (s ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+\n/g, "\n")
    .trim();
}

export async function runCodeTestCases(code: string, language: string, testCases: CodeTestCase[]) {
  const safeCode = String(code ?? "").slice(0, 20_000);
  const safeLanguage = String(language ?? "python").toLowerCase();
  const safeCases = testCases.slice(0, 25).map((tc) => ({
    input: String(tc?.input ?? "").slice(0, 5_000),
    expectedOutput: String(tc?.expectedOutput ?? "").slice(0, 5_000),
  }));

  if (!safeCode.trim()) {
    return safeCases.map((tc) => ({
      passed: false,
      input: tc.input,
      expected: tc.expectedOutput,
      got: "",
      error: "No code provided",
    }));
  }

  return Promise.all(
    safeCases.map(async (tc) => {
      const { stdout, stderr, exitCode } = await runOne(safeCode, safeLanguage, tc.input || "");
      const passed = exitCode === 0 && normalize(stdout) === normalize(tc.expectedOutput);
      return {
        passed,
        input: tc.input,
        expected: tc.expectedOutput,
        got: stdout,
        error: exitCode !== 0 ? stderr || "Runtime error" : stderr || undefined,
      };
    }),
  );
}

export async function handleCodeRunnerRequest(request: Request) {
  try {
    const body = (await request.json()) as {
      code?: unknown;
      language?: unknown;
      testCases?: unknown;
    };
    const code = String(body?.code ?? "");
    const language = String(body?.language ?? "python");
    const testCases: CodeTestCase[] = Array.isArray(body?.testCases)
      ? body.testCases.map((tc) => ({
          input: String((tc as Partial<CodeTestCase>)?.input ?? ""),
          expectedOutput: String((tc as Partial<CodeTestCase>)?.expectedOutput ?? ""),
        }))
      : [];
    const results = await runCodeTestCases(code, language, testCases);

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "unknown" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  }
}

export function handleCodeRunnerOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
