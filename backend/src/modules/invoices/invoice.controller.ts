import { Request, Response, NextFunction } from 'express';
import { invoiceService } from './invoice.service';
import { createInvoiceSchema, invoiceFilterSchema, updateInvoiceSchema } from './invoice.validation';
import { sendSuccess, sendError, sendPaginated } from '../../utils/helpers';

export class InvoiceController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = createInvoiceSchema.parse(req.body);
            const invoice = await invoiceService.create(req.user!._id, validatedData);
            sendSuccess(res, invoice, 'Invoice created successfully', 201);
        } catch (error: any) {
            if (error.message === 'Invoice number already exists') {
                sendError(res, error.message, 400);
            } else {
                next(error);
            }
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filters = invoiceFilterSchema.parse(req.query);
            const result = await invoiceService.getAll(req.user!._id, filters);

            sendPaginated(res, result.invoices, {
                page: filters.page || 1,
                limit: filters.limit || 10,
                total: result.total,
                totalPages: result.totalPages,
            }, {
                stats: result.stats,
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const invoice = await invoiceService.getById(req.user!._id, req.params.id);
            sendSuccess(res, invoice, 'Invoice retrieved successfully');
        } catch (error: any) {
            if (error.message === 'Invoice not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validatedData = updateInvoiceSchema.parse(req.body);
            const invoice = await invoiceService.update(req.user!._id, req.params.id, validatedData);
            sendSuccess(res, invoice, 'Invoice updated successfully');
        } catch (error: any) {
            if (error.message === 'Invoice not found') {
                sendError(res, error.message, 404);
            } else if (error.message === 'Invoice number already exists') {
                sendError(res, error.message, 400);
            } else {
                next(error);
            }
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await invoiceService.delete(req.user!._id, req.params.id);
            sendSuccess(res, null, 'Invoice deleted successfully');
        } catch (error: any) {
            if (error.message === 'Invoice not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    async getTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const templates = invoiceService.getTemplates();
            sendSuccess(res, templates, 'Templates retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getColorSchemes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const colorSchemes = invoiceService.getColorSchemes();
            sendSuccess(res, colorSchemes, 'Color schemes retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async share(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const shareData = await invoiceService.generateShareLink(req.user!._id, req.params.id);
            sendSuccess(res, shareData, 'Share link generated successfully');
        } catch (error: any) {
            if (error.message === 'Invoice not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    /**
     * Generate PDF preview for an invoice
     */
    async generatePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const templateId = req.query.template as string || 'modern';
            const colorSchemeId = req.query.color as string || 'blue';

            await invoiceService.generatePdf(req.user!._id, req.params.id, res, templateId, colorSchemeId);
        } catch (error: any) {
            if (error.message === 'Invoice not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    /**
     * Download PDF for an invoice
     */
    async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const templateId = req.query.template as string || 'modern';
            const colorSchemeId = req.query.color as string || 'blue';

            await invoiceService.downloadPdf(req.user!._id, req.params.id, res, templateId, colorSchemeId);
        } catch (error: any) {
            if (error.message === 'Invoice not found') {
                sendError(res, error.message, 404);
            } else {
                next(error);
            }
        }
    }

    /**
     * Preview PDF without saving
     */
    async previewPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await invoiceService.previewPdf(req.user!._id, req.body, res);
        } catch (error: any) {
            next(error);
        }
    }
}

export const invoiceController = new InvoiceController();
