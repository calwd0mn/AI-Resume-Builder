import OpenAI from "openai";
import { ProxyAgent } from "undici";

const resolvedApiKey =
  process.env.OPENAI_API_KEY ||
  process.env.QWEN_API_KEY ||
  process.env.GEMINI_API_KEY;

const resolvedBaseUrl =
  process.env.OPENAI_BASE_URL ||
  process.env.QWEN_BASE_URL;

const resolvedTimeout = Number(process.env.AI_TIMEOUT_MS || 60000);
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

const DOMESTIC_HOSTS = ['dashscope.aliyuncs.com', 'api.siliconflow.cn', 'open.bigmodel.cn'];
const needsProxy = proxyUrl && !DOMESTIC_HOSTS.some((h) => resolvedBaseUrl?.includes(h));

const proxyOptions = needsProxy
  ? { dispatcher: new ProxyAgent(proxyUrl) }
  : undefined;

export const ai = new OpenAI({
  apiKey: resolvedApiKey,
  baseURL: resolvedBaseUrl,
  timeout: Number.isFinite(resolvedTimeout) ? resolvedTimeout : 60000,
  maxRetries: 1,
  fetchOptions: proxyOptions as any,
});

console.log(`[AI] provider=${resolvedBaseUrl}, proxy=${needsProxy ? proxyUrl : 'direct'}`);
