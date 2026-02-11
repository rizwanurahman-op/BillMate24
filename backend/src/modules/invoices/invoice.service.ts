import mongoose from "mongoose";
import { Response } from "express";
import { Invoice } from "./invoice.model";
import {
  CreateInvoiceInput,
  InvoiceFilterInput,
  UpdateInvoiceInput,
} from "./invoice.validation";
import { InvoicePdfGenerator } from "./invoice-pdf.service";

export class InvoiceService {
  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(shopkeeperId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    // Find the last invoice for this shopkeeper
    const lastInvoice = await Invoice.findOne({
      shopkeeperId: new mongoose.Types.ObjectId(shopkeeperId),
    })
      .sort({ createdAt: -1 })
      .exec();

    let sequence = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      // Extract sequence from last invoice number (format: INV-YYYY-MM-XXXX)
      const match = lastInvoice.invoiceNumber.match(/INV-\d{4}-\d{2}-(\d+)/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }

    return `INV-${year}-${month}-${String(sequence).padStart(4, "0")}`;
  }

  /**
   * Create a new invoice
   */
  async create(shopkeeperId: string, input: CreateInvoiceInput): Promise<any> {
    // Generate invoice number if not provided
    const invoiceNumber =
      input.invoiceNumber || (await this.generateInvoiceNumber(shopkeeperId));

    // Check if invoice with this number already exists for this shopkeeper
    const existingInvoice = await Invoice.findOne({
      shopkeeperId: new mongoose.Types.ObjectId(shopkeeperId),
      invoiceNumber,
      isDeleted: false,
    });

    // If invoice exists and is a draft, update it instead of creating a new one
    // This allows users to preview and modify templates without errors
    if (existingInvoice) {
      if (existingInvoice.status === "draft") {
        // Update the existing draft invoice
        Object.keys(input).forEach((key) => {
          if (input[key as keyof CreateInvoiceInput] !== undefined) {
            if (key === "invoiceDate" || key === "dueDate") {
              (existingInvoice as any)[key] = new Date(
                input[key as keyof CreateInvoiceInput] as string,
              );
            } else {
              (existingInvoice as any)[key] =
                input[key as keyof CreateInvoiceInput];
            }
          }
        });

        await existingInvoice.save();
        return existingInvoice.toObject();
      } else {
        // If it's not a draft (paid, sent, cancelled), throw error
        throw new Error("Invoice number already exists");
      }
    }

    // Create new invoice
    const invoice = new Invoice({
      ...input,
      shopkeeperId,
      invoiceNumber,
      invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : new Date(),
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    });

    await invoice.save();
    return invoice.toObject();
  }

  /**
   * Find all invoices for a shopkeeper with filtering and pagination
   */
  async getAll(
    shopkeeperId: string,
    filters?: InvoiceFilterInput,
  ): Promise<{
    invoices: any[];
    total: number;
    totalPages: number;
    stats: any;
  }> {
    const {
      search,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters || {};

    const query: any = {
      shopkeeperId: new mongoose.Types.ObjectId(shopkeeperId),
      isDeleted: false,
    };

    // Search by invoice number or customer name
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) {
        query.invoiceDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = endDateObj;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Sort order
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      Invoice.countDocuments(query),
    ]);

    // Calculate stats
    const statsResult = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$total" },
          draftCount: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
          sentCount: {
            $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = statsResult[0] || {
      totalAmount: 0,
      draftCount: 0,
      sentCount: 0,
      paidCount: 0,
      cancelledCount: 0,
    };

    return {
      invoices: invoices.map((inv) => inv.toObject()),
      total,
      totalPages: Math.ceil(total / limit),
      stats,
    };
  }

  /**
   * Find one invoice by ID
   */
  async getById(shopkeeperId: string, id: string): Promise<any> {
    const invoice = await Invoice.findOne({
      _id: new mongoose.Types.ObjectId(id),
      shopkeeperId: new mongoose.Types.ObjectId(shopkeeperId),
      isDeleted: false,
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const invoiceObj = invoice.toObject();

    // Always fetch the LATEST shop details from user profile (settings page)
    // This ensures the PDF always uses the most up-to-date business info
    const { User } = require("../users/user.model");
    const shopkeeper = await User.findById(shopkeeperId);
    if (shopkeeper) {
      // ALWAYS override with latest user profile data — settings are the source of truth
      invoiceObj.shopName = shopkeeper.businessName || invoiceObj.shopName;
      invoiceObj.shopPhone = shopkeeper.phone || invoiceObj.shopPhone;
      (invoiceObj as any).shopEmail = shopkeeper.email;

      // ALWAYS build address fresh from user profile (address + place)
      const addressParts = [shopkeeper.address, shopkeeper.place].filter(
        Boolean,
      );
      const fullAddress = addressParts.join(", ");
      if (fullAddress) {
        invoiceObj.shopAddress = fullAddress;
      }
    }

    return invoiceObj;
  }

  /**
   * Update an invoice
   */
  async update(
    shopkeeperId: string,
    id: string,
    input: UpdateInvoiceInput,
  ): Promise<any> {
    // Check if invoice exists and belongs to shopkeeper
    const invoice = await Invoice.findOne({
      _id: new mongoose.Types.ObjectId(id),
      shopkeeperId: new mongoose.Types.ObjectId(shopkeeperId),
      isDeleted: false,
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // If updating invoice number, check uniqueness
    if (input.invoiceNumber && input.invoiceNumber !== invoice.invoiceNumber) {
      const existingInvoice = await Invoice.findOne({
        shopkeeperId: new mongoose.Types.ObjectId(shopkeeperId),
        invoiceNumber: input.invoiceNumber,
        _id: { $ne: new mongoose.Types.ObjectId(id) },
      });

      if (existingInvoice) {
        throw new Error("Invoice number already exists");
      }
    }

    // Update fields
    Object.keys(input).forEach((key) => {
      const val = input[key as keyof UpdateInvoiceInput];
      if (val !== undefined) {
        if (key === "invoiceDate" || key === "dueDate") {
          if (val === null || val === "") {
            (invoice as any)[key] = null;
          } else {
            const date = new Date(val as string);
            if (!isNaN(date.getTime())) {
              (invoice as any)[key] = date;
            }
          }
        } else {
          (invoice as any)[key] = val;
        }
      }
    });

    await invoice.save();
    return invoice.toObject();
  }

  /**
   * Delete an invoice (soft delete)
   */
  async delete(shopkeeperId: string, id: string): Promise<void> {
    const invoice = await Invoice.findOne({
      _id: new mongoose.Types.ObjectId(id),
      shopkeeperId: new mongoose.Types.ObjectId(shopkeeperId),
      isDeleted: false,
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Soft delete
    invoice.isDeleted = true;
    invoice.deletedAt = new Date();
    await invoice.save();
  }

  /**
   * Get invoice templates
   */
  getTemplates() {
    return [
      {
        id: "modern",
        name: "Modern",
        description: "Clean, minimalist design with bold typography",
        colorSchemes: ["blue", "green", "purple", "orange", "red", "gray"],
      },
      {
        id: "classic",
        name: "Classic",
        description: "Traditional invoice layout with professional appearance",
        colorSchemes: ["blue", "green", "purple", "orange", "red", "gray"],
      },
      {
        id: "minimal",
        name: "Minimal",
        description: "Ultra-clean design with maximum white space",
        colorSchemes: ["blue", "green", "purple", "orange", "red", "gray"],
      },
      {
        id: "professional",
        name: "Professional",
        description: "Corporate look with structured layout",
        colorSchemes: ["blue", "green", "purple", "orange", "red", "gray"],
      },
      {
        id: "colorful",
        name: "Colorful",
        description: "Vibrant design with modern gradients",
        colorSchemes: ["blue", "green", "purple", "orange", "red", "gray"],
      },
      {
        id: "tax",
        name: "Tax Invoice",
        description: "Simple tax invoice format with payment details section",
        colorSchemes: ["blue", "green", "purple", "orange", "red", "gray"],
      },
    ];
  }

  /**
   * Get color schemes
   */
  getColorSchemes() {
    return [
      {
        id: "blue",
        name: "Blue",
        primary: "#3B82F6",
        secondary: "#1E40AF",
        accent: "#DBEAFE",
      },
      {
        id: "green",
        name: "Green",
        primary: "#10B981",
        secondary: "#047857",
        accent: "#D1FAE5",
      },
      {
        id: "purple",
        name: "Purple",
        primary: "#8B5CF6",
        secondary: "#6D28D9",
        accent: "#EDE9FE",
      },
      {
        id: "orange",
        name: "Orange",
        primary: "#F59E0B",
        secondary: "#D97706",
        accent: "#FEF3C7",
      },
      {
        id: "red",
        name: "Red",
        primary: "#EF4444",
        secondary: "#DC2626",
        accent: "#FEE2E2",
      },
      {
        id: "gray",
        name: "Gray",
        primary: "#6B7280",
        secondary: "#374151",
        accent: "#F3F4F6",
      },
    ];
  }

  /**
   * Generate WhatsApp share link
   */
  async generateShareLink(
    shopkeeperId: string,
    id: string,
  ): Promise<{ url: string; message: string }> {
    const invoice = await this.getById(shopkeeperId, id);

    const message =
      `📄 *Invoice #${invoice.invoiceNumber}*\n\n` +
      `👤 Customer: ${invoice.customerName}\n` +
      `💰 Amount: ₹${invoice.total.toLocaleString("en-IN")}\n` +
      `📅 Date: ${new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}\n` +
      `📊 Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}\n\n` +
      `View invoice: ${process.env.FRONTEND_URL || "http://localhost:3000"}/shopkeeper/invoices/${invoice._id}/preview`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    return {
      url: whatsappUrl,
      message,
    };
  }

  /**
   * Generate and stream PDF for preview
   */
  async generatePdf(
    shopkeeperId: string,
    id: string,
    res: Response,
    templateId: string,
    colorSchemeId: string,
  ): Promise<void> {
    const invoice = await this.getById(shopkeeperId, id);
    const colorScheme =
      this.getColorSchemes().find((c) => c.id === colorSchemeId) ||
      this.getColorSchemes()[0];

    const pdfGenerator = new InvoicePdfGenerator(invoice, colorScheme);
    await pdfGenerator.generateAndSend(res, templateId);
  }

  /**
   * Generate and download PDF
   */
  async downloadPdf(
    shopkeeperId: string,
    id: string,
    res: Response,
    templateId: string,
    colorSchemeId: string,
  ): Promise<void> {
    const invoice = await this.getById(shopkeeperId, id);
    const colorScheme =
      this.getColorSchemes().find((c) => c.id === colorSchemeId) ||
      this.getColorSchemes()[0];

    // Set download header instead of inline
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    );

    const pdfGenerator = new InvoicePdfGenerator(invoice, colorScheme);
    await pdfGenerator.generateAndSend(res, templateId);
  }

  /**
   * Preview PDF from raw data (without saving to DB)
   */
  async previewPdf(
    shopkeeperId: string,
    input: any,
    res: Response,
  ): Promise<void> {
    const templateId = input.templateId || "modern";
    const colorSchemeId = input.colorScheme || "blue";

    const colorScheme =
      this.getColorSchemes().find((c) => c.id === colorSchemeId) ||
      this.getColorSchemes()[0];

    // Always fetch the LATEST shop details from user profile 
    const { User } = require("../users/user.model");
    const shopkeeper = await User.findById(shopkeeperId);

    // Construct temporal invoice object for generator
    const tempInvoice = {
      ...input,
      invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : new Date(),
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    };

    if (shopkeeper) {
      tempInvoice.shopName = shopkeeper.businessName || tempInvoice.shopName;
      tempInvoice.shopPhone = shopkeeper.phone || tempInvoice.shopPhone;
      tempInvoice.shopEmail = shopkeeper.email;
      const addressParts = [shopkeeper.address, shopkeeper.place].filter(Boolean);
      const fullAddress = addressParts.join(", ");
      if (fullAddress) {
        tempInvoice.shopAddress = fullAddress;
      }
    }

    const pdfGenerator = new InvoicePdfGenerator(tempInvoice, colorScheme);
    await pdfGenerator.generateAndSend(res, templateId);
  }
}

export const invoiceService = new InvoiceService();
