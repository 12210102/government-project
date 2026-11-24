const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callGroq(messages: GroqMessage[], temperature = 0.3): Promise<string> {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function extractJson(text: string): unknown {
  let cleaned = text.trim();
  // Strip markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  // Find the first { and last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

// ============================================================
// LangGraph-style workflow nodes
// Each node receives the accumulated state and returns updates.
// ============================================================

interface WorkflowState {
  sourceText: string;
  sourceType: string;
  extractedInfo: Record<string, unknown>;
  fiveWhys: { step_number: number; question: string; answer: string; is_root_cause: boolean }[];
  fishbone: { category: string; causes: { cause: string; evidence: string }[] }[];
  rootCauses: {
    description: string;
    category: string;
    contributing_factors: string[];
    confidence: string;
    evidence_summary: string;
    confirmed: boolean;
  }[];
  evidenceGaps: { description: string; significance: string; status: string }[];
  capas: {
    type: string;
    description: string;
    rationale: string;
    owner: string;
    target_date: string | null;
    status: string;
  }[];
}

// Node 1: Extract deviation information from source text
async function nodeExtractDeviation(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const systemPrompt = `You are a pharmaceutical Quality Assurance expert AI assistant. Your task is to extract structured deviation information from an incident report, investigation document, or email related to Active Pharmaceutical Ingredient (API) manufacturing.

Extract the following fields:
- title: A concise title for the deviation (max 80 chars)
- product_name: The API or product name involved
- batch_number: The manufacturing batch number
- deviation_date: Date of the deviation (YYYY-MM-DD format, or null if not found)
- deviation_description: Detailed description of what happened
- deviation_category: One of: Process, Equipment, Analytical, Documentation, Environmental, Material, Utility, Other
- severity: One of: Minor, Major, Critical
- process_step: The manufacturing process step where the deviation occurred
- equipment_involved: Equipment names involved
- material_impact: Description of impact on materials or batch
- initial_risk_assessment: Initial risk assessment summary

Return ONLY a JSON object. If a field is not found in the text, use an empty string or null.`;

  const userPrompt = `Source type: ${state.sourceType}\n\nSource content:\n${state.sourceText}`;

  const result = await callGroq([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const extracted = extractJson(result) as Record<string, unknown>;

  return { extractedInfo: extracted };
}

// Node 2: Generate 5 Whys analysis
async function nodeFiveWhys(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const info = state.extractedInfo;
  const systemPrompt = `You are a pharmaceutical Quality Assurance expert. Perform a 5 Whys root cause analysis for the given deviation in API manufacturing.

Generate exactly 5 sequential "Why" questions and answers. Each answer should logically lead to the next "Why" question. The final answer (step 5 or earlier if definitive) should represent the root cause. Mark the step that identifies the root cause with is_root_cause: true.

Return a JSON object with a "steps" array, where each element has:
- step_number: 1-5
- question: The "Why..." question
- answer: The answer
- is_root_cause: boolean

Return ONLY valid JSON.`;

  const userPrompt = `Deviation information:
Title: ${info.title ?? ""}
Product: ${info.product_name ?? ""}
Batch: ${info.batch_number ?? ""}
Description: ${info.deviation_description ?? ""}
Process Step: ${info.process_step ?? ""}
Equipment: ${info.equipment_involved ?? ""}
Category: ${info.deviation_category ?? ""}`;

  const result = await callGroq([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const parsed = extractJson(result) as { steps: { step_number: number; question: string; answer: string; is_root_cause: boolean }[] };

  return { fiveWhys: parsed.steps ?? [] };
}

// Node 3: Generate Fishbone (Ishikawa) analysis
async function nodeFishbone(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const info = state.extractedInfo;
  const systemPrompt = `You are a pharmaceutical Quality Assurance expert. Perform a Fishbone (Ishikawa) analysis for the given deviation in API manufacturing.

Use the 6M categories: Methods, Machines, Materials, Manpower, Measurement, Environment.
For each category, identify potential causes relevant to the deviation. Each cause should include a brief evidence or reasoning.

Return a JSON object with a "categories" array, where each element has:
- category: The category name
- causes: Array of { cause: string, evidence: string }

Only include categories that are relevant. Return ONLY valid JSON.`;

  const userPrompt = `Deviation information:
Title: ${info.title ?? ""}
Product: ${info.product_name ?? ""}
Description: ${info.deviation_description ?? ""}
Process Step: ${info.process_step ?? ""}
Equipment: ${info.equipment_involved ?? ""}
Category: ${info.deviation_category ?? ""}`;

  const result = await callGroq([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const parsed = extractJson(result) as { categories: { category: string; causes: { cause: string; evidence: string }[] }[] };

  return { fishbone: parsed.categories ?? [] };
}

// Node 4: Identify root causes and contributing factors
async function nodeRootCauses(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const info = state.extractedInfo;
  const fiveWhysSummary = state.fiveWhys.map((w) => `Why ${w.step_number}: ${w.question}\nAnswer: ${w.answer}`).join("\n\n");
  const fishboneSummary = state.fishbone
    .map((f) => `${f.category}: ${f.causes.map((c) => c.cause).join("; ")}`)
    .join("\n");

  const systemPrompt = `You are a pharmaceutical Quality Assurance expert. Based on the 5 Whys and Fishbone analysis results, identify the most likely root cause(s) and contributing factors for this API manufacturing deviation.

For each root cause, provide:
- description: The root cause description
- category: Classification (e.g. Equipment, Procedure, Training, Material, Environmental, Human Error, System)
- contributing_factors: Array of contributing factor strings
- confidence: One of "High", "Medium", "Low" based on evidence strength
- evidence_summary: Summary of supporting evidence from the analysis
- confirmed: false (these are AI suggestions, not yet confirmed)

IMPORTANT: These are AI-suggested root causes and must be treated as suggestions unless supported by evidence and confirmed by a qualified person.

Return a JSON object with a "root_causes" array. Return ONLY valid JSON.`;

  const userPrompt = `Deviation: ${info.deviation_description ?? ""}

5 Whys Analysis:
${fiveWhysSummary}

Fishbone Analysis:
${fishboneSummary}`;

  const result = await callGroq([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const parsed = extractJson(result) as { root_causes: WorkflowState["rootCauses"] };

  return { rootCauses: parsed.root_causes ?? [] };
}

// Node 5: Identify evidence gaps
async function nodeEvidenceGaps(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const info = state.extractedInfo;
  const rootCausesSummary = state.rootCauses.map((rc) => `- ${rc.description} (confidence: ${rc.confidence})`).join("\n");

  const systemPrompt = `You are a pharmaceutical Quality Assurance expert. Identify what evidence or information is missing that would be needed to confirm or refute the identified root causes for this API manufacturing deviation.

Consider what additional data, records, tests, or documentation would strengthen the investigation. Each gap should be specific and actionable.

Return a JSON object with a "gaps" array, where each element has:
- description: What evidence/information is missing
- significance: One of "High", "Medium", "Low"
- status: "open"

Return ONLY valid JSON.`;

  const userPrompt = `Deviation: ${info.deviation_description ?? ""}
Product: ${info.product_name ?? ""}
Batch: ${info.batch_number ?? ""}

Identified Root Causes:
${rootCausesSummary}

Available information: ${state.sourceText.substring(0, 2000)}`;

  const result = await callGroq([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const parsed = extractJson(result) as { gaps: WorkflowState["evidenceGaps"] };

  return { evidenceGaps: parsed.gaps ?? [] };
}

// Node 6: Generate CAPA recommendations
async function nodeCapas(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const info = state.extractedInfo;
  const rootCausesSummary = state.rootCauses.map((rc) => `- ${rc.description} (Category: ${rc.category})`).join("\n");

  const systemPrompt = `You are a pharmaceutical Quality Assurance expert. Based on the identified root causes, recommend Corrective and Preventive Actions (CAPA) for this API manufacturing deviation.

Corrective actions address the immediate issue. Preventive actions prevent recurrence.

For each CAPA, provide:
- type: "corrective" or "preventive"
- description: The action to be taken
- rationale: Brief explanation of why this action is recommended
- owner: Suggested responsible department or role (e.g. "QA", "Manufacturing", "Engineering", "QC Lab")
- target_date: null (to be assigned by the team)
- status: "proposed"

Recommend at least 2 corrective and 2 preventive actions. Return a JSON object with a "capas" array. Return ONLY valid JSON.`;

  const userPrompt = `Deviation: ${info.deviation_description ?? ""}
Product: ${info.product_name ?? ""}
Category: ${info.deviation_category ?? ""}
Severity: ${info.severity ?? ""}

Root Causes:
${rootCausesSummary}`;

  const result = await callGroq([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const parsed = extractJson(result) as { capas: WorkflowState["capas"] };

  return { capas: parsed.capas ?? [] };
}

// Run the LangGraph-style workflow: a directed acyclic graph of nodes.
// Extraction -> (5 Whys, Fishbone in parallel) -> Root Causes -> (Evidence Gaps, CAPA in parallel)
async function runWorkflow(sourceText: string, sourceType: string): Promise<WorkflowState> {
  let state: WorkflowState = {
    sourceText,
    sourceType,
    extractedInfo: {},
    fiveWhys: [],
    fishbone: [],
    rootCauses: [],
    evidenceGaps: [],
    capas: [],
  };

  // Node 1: Extract deviation info
  state = { ...state, ...(await nodeExtractDeviation(state)) };

  // Nodes 2 & 3: 5 Whys and Fishbone in parallel
  const [fiveWhysResult, fishboneResult] = await Promise.all([
    nodeFiveWhys(state),
    nodeFishbone(state),
  ]);
  state = { ...state, ...fiveWhysResult, ...fishboneResult };

  // Node 4: Root causes (depends on 5 Whys + Fishbone)
  state = { ...state, ...(await nodeRootCauses(state)) };

  // Nodes 5 & 6: Evidence gaps and CAPA in parallel (both depend on root causes)
  const [gapsResult, capasResult] = await Promise.all([
    nodeEvidenceGaps(state),
    nodeCapas(state),
  ]);
  state = { ...state, ...gapsResult, ...capasResult };

  return state;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not configured. Please add it as an edge function secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { sourceText, sourceType, action } = body;

    if (action === "analyze") {
      if (!sourceText || typeof sourceText !== "string") {
        return new Response(
          JSON.stringify({ error: "sourceText is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const result = await runWorkflow(sourceText, sourceType || "text");

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use action: 'analyze'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
