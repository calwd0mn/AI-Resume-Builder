import express from "express";
import { randomUUID } from "crypto";
import protect from "../middlewares/authMiddleware.js";
import {
  enhanceJobDescription,
  enhanceJobDescriptionStream,
  enhanceProfessionalSummary,
  enhanceProfessionalSummaryStream,
  uploadResume
} from "../controllers/aiController.js";



const aiRouter = express.Router();
aiRouter.use((req, res, next) => {
  const incomingTraceId = req.header('x-trace-id');
  const traceId = incomingTraceId && incomingTraceId.trim() ? incomingTraceId : randomUUID();
  const startedAt = Date.now();

  req.headers['x-trace-id'] = traceId;
  res.setHeader('x-trace-id', traceId);

  console.log(`[AI][${traceId}] <-- ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    console.log(`[AI][${traceId}] --> ${res.statusCode} ${duration}ms ${req.method} ${req.originalUrl}`);
  });

  next();
});


aiRouter.post('/enhance-pro-sum', protect, enhanceProfessionalSummary)
aiRouter.post('/enhance-job-desc', protect, enhanceJobDescription)
aiRouter.post('/enhance-pro-sum-stream', protect, enhanceProfessionalSummaryStream)
aiRouter.post('/enhance-job-desc-stream', protect, enhanceJobDescriptionStream)
aiRouter.post('/upload-resume', protect, uploadResume)

export default aiRouter
