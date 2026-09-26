/**
 * Investigation API Routes
 */

import { Request, Response, Router } from 'express';
import { EDUCATIONAL_EXAMPLES } from '../data/examples.js';
import { InvestigationService } from '../services/investigation.js';
import {
  InvestigateErrorResponse,
  InvestigateRequest,
  InvestigateSuccessResponse,
} from '../types.js';

export function createInvestigationRouter(investigationService: InvestigationService): Router {
  const router = Router();

  /**
   * POST /api/investigate
   * Primary investigation endpoint
   */
  router.post('/investigate', async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, messageType, victimState } = req.body as InvestigateRequest;

      if (!text || typeof text !== 'string') {
        const errorResponse: InvestigateErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A non-empty text string is required for investigation.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (text.trim().length < 5) {
        const errorResponse: InvestigateErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input text is too short to investigate. Minimum 5 characters required.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      if (text.length > 10000) {
        const errorResponse: InvestigateErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input text exceeds the maximum limit of 10,000 characters.',
          },
        };
        res.status(400).json(errorResponse);
        return;
      }

      const report = await investigationService.investigate({ text, messageType, victimState });
      const successResponse: InvestigateSuccessResponse = {
        success: true,
        report,
      };

      res.status(200).json(successResponse);
    } catch (err: any) {
      const errorResponse: InvestigateErrorResponse = {
        success: false,
        error: {
          code: 'INVESTIGATION_ERROR',
          message: err?.message || 'An unexpected error occurred during investigation analysis.',
        },
      };
      res.status(500).json(errorResponse);
    }
  });

  /**
   * POST /api/investigate/url
   * Dedicated URL deep investigation with SSRF defense barrier
   */
  router.post('/investigate/url', async (req: Request, res: Response): Promise<void> => {
    try {
      const { url } = req.body as { url?: string };
      if (!url || typeof url !== 'string' || url.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A valid URL string is required.',
          },
        });
        return;
      }

      const result = await investigationService.investigateUrl(url.trim());
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'URL_INVESTIGATION_ERROR',
          message: err?.message || 'Failed to inspect URL.',
        },
      });
    }
  });

  /**
   * POST /api/investigate/screenshot
   * Screenshot upload and OCR text investigation
   */
  router.post('/investigate/screenshot', async (req: Request, res: Response): Promise<void> => {
    try {
      const { imageBase64, filename } = req.body as { imageBase64?: string; filename?: string };

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Image data (imageBase64) is required.',
          },
        });
        return;
      }

      const base64Clean = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const buffer = Buffer.from(base64Clean, 'base64');

      if (buffer.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The uploaded image contains 0 bytes.',
          },
        });
        return;
      }

      const report = await investigationService.investigateScreenshot(buffer, filename);
      res.status(200).json({
        success: true,
        report,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: {
          code: err?.code || 'OCR_INVESTIGATION_ERROR',
          message: err?.message || 'Failed to analyze screenshot.',
        },
      });
    }
  });

  /**
   * GET /api/examples
   * Returns safe educational presets
   */
  router.get('/examples', (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      examples: EDUCATIONAL_EXAMPLES,
    });
  });

  /**
   * GET /api/health
   * System status and active AI provider state
   */
  router.get('/health', (_req: Request, res: Response): void => {
    const aiInfo = investigationService.getActiveAiProviderInfo();
    res.status(200).json({
      status: 'operational',
      service: 'Digital Scam Investigator Engine',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      ai: aiInfo,
    });
  });

  return router;
}
