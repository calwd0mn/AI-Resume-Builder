import { AuthRequest } from "../middlewares/authMiddleware";
import { Response } from "express";
import { ai } from "../configs/ai.js";
import Resume from "../modules/Resume";
import { JOB_DESC_SYSTEM_PROMPT, SUMMARY_SYSTEM_PROMPT } from "../prompts/aiPrompts.js";

const MAX_RESUME_TEXT_LENGTH = 16000;

const MAX_PRO_SUMMARY_INPUT_LENGTH = 800;
const PRO_SUMMARY_TIMEOUT_MS = Number(process.env.PRO_SUMMARY_TIMEOUT_MS || 155000);
const PRO_SUMMARY_MAX_TOKENS = Number(process.env.PRO_SUMMARY_MAX_TOKENS || 140);
const JOB_DESC_TIMEOUT_MS = Number(process.env.JOB_DESC_TIMEOUT_MS || 55000);
const UPLOAD_RESUME_TIMEOUT_MS = Number(process.env.UPLOAD_RESUME_TIMEOUT_MS || 90000);

const getTraceId = (req: AuthRequest): string => {
  const traceId = req.headers['x-trace-id'];
  if (Array.isArray(traceId)) {
    return traceId[0] || 'trace-missing';
  }
  return traceId || 'trace-missing';
};

const normalizeSummaryInput = (input: string): string => {
  return input
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^enhance my professional summary:\s*/i, '')
    .trim()
    .slice(0, MAX_PRO_SUMMARY_INPUT_LENGTH);
};

const buildSummaryFallback = (input: string): string => {
  const cleaned = normalizeSummaryInput(input);
  if (!cleaned) {
    return 'Results-driven professional with strong execution and collaboration skills, focused on delivering measurable impact.';
  }

  const sentenceSegments = cleaned
    .split(/(?<=[.!?])\s+|\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  let summary = sentenceSegments.slice(0, 2).join(' ');
  if (!summary) {
    summary = cleaned;
  }

  if (summary.length < 70) {
    summary = `${summary} Brings strong ownership, communication, and continuous improvement mindset.`;
  }

  return summary.slice(0, 320);
};

const isAiTimeoutError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as { code?: string; status?: number; name?: string; message?: string };
  const message = String(err.message || '').toLowerCase();
  return (
    err.code === 'ETIMEDOUT' ||
    err.code === 'ECONNABORTED' ||
    err.status === 408 ||
    err.status === 504 ||
    err.name === 'AbortError' ||
    err.name === 'APIConnectionTimeoutError' ||
    err.name === 'TimeoutError' ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('request timed out') ||
    message.includes('deadline exceeded')
  );
};

const prepareResumeTextForExtraction = (input: string): string => {
  return input
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_RESUME_TEXT_LENGTH);
};

const writeSseHeaders = (res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }
};

const sendSseEvent = (res: Response, event: 'chunk' | 'done' | 'error', payload: Record<string, unknown>) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const bindAbortOnDisconnect = (req: AuthRequest, res: Response, controller: AbortController) => {
  // IncomingMessage "close" may fire after body is consumed; avoid aborting healthy streams.
  req.on('aborted', () => controller.abort());
  res.on('close', () => {
    if (!res.writableEnded) {
      controller.abort();
    }
  });
};

// controller for enhanceing a resume's professional summary
// POST: /api/ai/enhance-pro-sum
export const enhanceProfessionalSummary = async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const { userContent } = req.body;
  const safeContent = normalizeSummaryInput(String(userContent || ''));
  const fallbackSummary = buildSummaryFallback(safeContent);
  const logPrefix = `[AI][${traceId}][enhance-pro-sum]`;

  try {
    const model = process.env.OPENAI_MODEL || process.env.QWEN_MODEL;
    console.log(`${logPrefix} received, inputLength=${safeContent.length}`);

    if (!safeContent) {
      return res.status(400).json({ message: 'User content is required', traceId })
    }
    if (!model) {
      return res.status(500).json({ message: 'OPENAI_MODEL is not configured', traceId })
    }

    console.log(`${logPrefix} calling model=${model}, timeoutMs=${PRO_SUMMARY_TIMEOUT_MS}, maxTokens=${PRO_SUMMARY_MAX_TOKENS}`);
    const controller = new AbortController();
    const timeoutMs = Number.isFinite(PRO_SUMMARY_TIMEOUT_MS) ? PRO_SUMMARY_TIMEOUT_MS : 25000;
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    const response = await ai.chat.completions.create({
      model: model as string,
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: safeContent }
      ],
      max_tokens: Number.isFinite(PRO_SUMMARY_MAX_TOKENS) ? PRO_SUMMARY_MAX_TOKENS : 140,
      temperature: 0.3
    }, {
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutHandle);
    });
    const content = response?.choices?.[0]?.message?.content?.trim();
    const enhancedSummary = content || fallbackSummary;
    console.log(`${logPrefix} ai response received, contentLength=${content?.length || 0}, fallbackUsed=${!content}`);
    return res.status(200).json({ enhancedSummary, fromFallback: !content, traceId })

  } catch (error) {
    const err = error as { code?: string; status?: number; name?: string; message?: string };
    console.error(`${logPrefix} error detail`, {
      code: err?.code,
      status: err?.status,
      name: err?.name,
      message: err?.message
    });

    if (isAiTimeoutError(error)) {
      console.warn(`${logPrefix} timeout, fallback returned`);
      return res.status(200).json({ enhancedSummary: fallbackSummary, fromFallback: true, traceId })
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${logPrefix} failed, message=${message}`);
    return res.status(400).json({ message, enhancedSummary: fallbackSummary, fromFallback: true, traceId })
  }
}

// controller for streaming enhanced professional summary
// POST: /api/ai/enhance-pro-sum-stream
export const enhanceProfessionalSummaryStream = async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const { userContent } = req.body;
  const safeContent = normalizeSummaryInput(String(userContent || ''));
  const fallbackSummary = buildSummaryFallback(safeContent);
  const logPrefix = `[AI][${traceId}][enhance-pro-sum-stream]`;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  writeSseHeaders(res);

  try {
    const model = process.env.OPENAI_MODEL || process.env.QWEN_MODEL;
    console.log(`${logPrefix} received, inputLength=${safeContent.length}`);

    if (!safeContent) {
      sendSseEvent(res, 'error', { message: 'User content is required', traceId });
      return res.end();
    }
    if (!model) {
      sendSseEvent(res, 'error', { message: 'OPENAI_MODEL is not configured', traceId });
      return res.end();
    }

    const controller = new AbortController();
    const timeoutMs = Number.isFinite(PRO_SUMMARY_TIMEOUT_MS) ? PRO_SUMMARY_TIMEOUT_MS : 25000;
    timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
    bindAbortOnDisconnect(req, res, controller);

    console.log(`${logPrefix} streaming started, model=${model}, timeoutMs=${timeoutMs}`);
    const stream = await ai.chat.completions.create({
      model: model as string,
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: safeContent }
      ],
      max_tokens: Number.isFinite(PRO_SUMMARY_MAX_TOKENS) ? PRO_SUMMARY_MAX_TOKENS : 140,
      temperature: 0.3,
      stream: true
    }, {
      signal: controller.signal
    });

    let enhancedSummary = '';
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (!delta) continue;
      enhancedSummary += delta;
      sendSseEvent(res, 'chunk', { delta, traceId });
    }

    const finalText = enhancedSummary.trim() || fallbackSummary;
    sendSseEvent(res, 'done', {
      result: finalText,
      fromFallback: !enhancedSummary.trim(),
      traceId
    });
    return res.end();
  } catch (error) {
    const err = error as { code?: string; status?: number; name?: string; message?: string };
    console.error(`${logPrefix} stream error detail`, {
      code: err?.code,
      status: err?.status,
      name: err?.name,
      message: err?.message
    });

    if (isAiTimeoutError(error)) {
      sendSseEvent(res, 'chunk', { delta: fallbackSummary, traceId });
      sendSseEvent(res, 'done', { result: fallbackSummary, fromFallback: true, traceId });
      return res.end();
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    sendSseEvent(res, 'error', { message, traceId });
    return res.end();
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}
// controller for enhancing a resume's job description
// POST: /api/ai/enhance-job-desc
export const enhanceJobDescription = async (req: AuthRequest, res: Response) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    const model = process.env.OPENAI_MODEL || process.env.QWEN_MODEL;
    if (!model) {
      return res.status(500).json({ message: 'OPENAI_MODEL is not configured' })
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), JOB_DESC_TIMEOUT_MS);

    const response = await ai.chat.completions.create({
      model: model as string,
      messages: [
        {
          role: "system",
          content: JOB_DESC_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    }, {
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutHandle);
    });

    const enhancedContent = response.choices[0].message.content;
    return res.status(200).json({ enhancedContent })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ message: message })
  }
}

// controller for streaming enhanced job description
// POST: /api/ai/enhance-job-desc-stream
export const enhanceJobDescriptionStream = async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const logPrefix = `[AI][${traceId}][enhance-job-desc-stream]`;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  writeSseHeaders(res);

  try {
    const { userContent } = req.body;
    const safeContent = normalizeSummaryInput(String(userContent || ''));

    if (!safeContent) {
      sendSseEvent(res, 'error', { message: 'Missing required fields', traceId });
      return res.end();
    }

    const model = process.env.OPENAI_MODEL || process.env.QWEN_MODEL;
    if (!model) {
      sendSseEvent(res, 'error', { message: 'OPENAI_MODEL is not configured', traceId });
      return res.end();
    }

    const fallbackSummary = buildSummaryFallback(safeContent);
    const controller = new AbortController();
    timeoutHandle = setTimeout(() => controller.abort(), JOB_DESC_TIMEOUT_MS);

    bindAbortOnDisconnect(req, res, controller);

    console.log(`${logPrefix} streaming started, model=${model}, timeoutMs=${JOB_DESC_TIMEOUT_MS}`);
    const stream = await ai.chat.completions.create({
      model: model as string,
      messages: [
        {
          role: "system",
          content: JOB_DESC_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: safeContent,
        },
      ],
      stream: true
    }, {
      signal: controller.signal
    });

    let enhancedContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (!delta) continue;
      enhancedContent += delta;
      sendSseEvent(res, 'chunk', { delta, traceId });
    }

    const finalText = enhancedContent.trim() || fallbackSummary;
    sendSseEvent(res, 'done', { result: finalText, fromFallback: !enhancedContent.trim(), traceId });
    return res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${logPrefix} stream failed, message=${message}`);

    if (isAiTimeoutError(error)) {
      sendSseEvent(res, 'error', { message: 'AI request timeout', traceId });
      return res.end();
    }

    sendSseEvent(res, 'error', { message, traceId });
    return res.end();
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}


// controller for uploading a resume to the database
// POST: /api/ai/upload-resume
export const uploadResume = async (req: AuthRequest, res: Response) => {
  try {

    const { resumeText, title } = req.body;
    const userId = req.userId;
    const model = process.env.OPENAI_MODEL || process.env.QWEN_MODEL;
    if (!model) {
      return res.status(500).json({ message: 'OPENAI_MODEL is not configured' })
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Title is required' })
    }
    if (!resumeText || !String(resumeText).trim()) {
      return res.status(400).json({ message: 'Resume text is empty. Please upload a text-based PDF.' })
    }

    const cleanedResumeText = prepareResumeTextForExtraction(String(resumeText));
    if (!cleanedResumeText) {
      return res.status(400).json({ message: 'Resume text is empty after cleanup.' })
    }

    const systemPrompt = '你是一个专业的简历数据提取专家。请从文本中提取结构化信息，要求:1. 严格输出 JSON 格式，不含任何解释或 Markdown 标签。2. 保持字段精简，若某项缺失则返回空字符串或空数组。3. 纠正文本中明显的扫描错误（如“泻染”纠正为“渲染”）。'

    const userPrompt = `请提取以下简历内容：
[简历文本开始]
${cleanedResumeText}
[简历文本结束]

输出格式严格参考此 JSON 样例：
{
  "personal_info": {
    "full_name": "", "profession": "", "email": "", "phone": "", "location": "", "website": ""
  },
  "skills": [],
  "education": [
    {"institution": "", "degree": "", "field": "", "graduation_date": "", "gpa": ""}
  ],
  "experience": [
    {"company": "", "position": "", "start_date": "", "end_date": "", "description": "", "is_current": false}
  ],
  "projects": [
    {"name": "", "type": "", "description": ""}
  ],
  "professional_summary": ""
}
      `;

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), UPLOAD_RESUME_TIMEOUT_MS);

    const response = await ai.chat.completions.create({
      model: model as string,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' }
    }, {
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutHandle);
    });

    const extractedData = response.choices[0].message.content;
    if (!extractedData) {
      return res.status(400).json({ message: '数据提取失败，请稍后重试' })
    }
    const parsedData = JSON.parse(extractedData)
    const newResume = await Resume.create({ userId, title, ...parsedData })

    res.json({ resumeId: newResume._id })
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return res.status(400).json({ message: message })
  }
}
