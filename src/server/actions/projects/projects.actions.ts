'use server';

import { ToolId } from '@/config/tools';
import { MESSAGES } from '@/lib/messages';
import { writeAction } from '@/server/actions/action';
import * as projectsService from '@/server/services/projects/projects.service';
import {
  createInvoiceSchema,
  idOnlySchema,
  paymentProfileFieldsSchema,
  projectFieldsSchema,
  setInvoiceStatusSchema,
  updatePaymentProfileSchema,
  updateProjectSchema,
} from '@/server/validators/projects/projects.schema';

const PROJECTS = { tool: ToolId.PROJECTS, requireAdmin: true } as const;

export const createProject = writeAction({
  ...PROJECTS,
  input: projectFieldsSchema,
  fallback: MESSAGES.PROJECT.SAVE_ERROR,
  logMessage: 'Create project failed',
  run: (input, actor) => projectsService.createProject(actor, input),
});

export const updateProject = writeAction({
  ...PROJECTS,
  input: updateProjectSchema,
  fallback: MESSAGES.PROJECT.SAVE_ERROR,
  logMessage: 'Update project failed',
  run: (input, actor) => projectsService.updateProject(actor, input),
});

export const createPaymentProfile = writeAction({
  ...PROJECTS,
  input: paymentProfileFieldsSchema,
  fallback: MESSAGES.PAYMENT_PROFILE.SAVE_ERROR,
  logMessage: 'Create payment details failed',
  run: (input) => projectsService.createPaymentProfile(input),
});

export const updatePaymentProfile = writeAction({
  ...PROJECTS,
  input: updatePaymentProfileSchema,
  fallback: MESSAGES.PAYMENT_PROFILE.SAVE_ERROR,
  logMessage: 'Update payment details failed',
  run: (input) => projectsService.updatePaymentProfile(input),
});

export const deletePaymentProfile = writeAction({
  ...PROJECTS,
  input: idOnlySchema,
  fallback: MESSAGES.PAYMENT_PROFILE.DELETE_ERROR,
  logMessage: 'Delete payment details failed',
  run: ({ id }) => projectsService.deletePaymentProfile(id),
});

export const createInvoice = writeAction({
  ...PROJECTS,
  input: createInvoiceSchema,
  fallback: MESSAGES.INVOICE.CREATE_ERROR,
  logMessage: 'Create invoice failed',
  run: async (input, actor) => {
    const invoice = await projectsService.createInvoice(actor, input);
    return { id: invoice.id, number: invoice.number };
  },
});

export const setInvoiceStatus = writeAction({
  ...PROJECTS,
  input: setInvoiceStatusSchema,
  fallback: MESSAGES.INVOICE.STATUS_ERROR,
  logMessage: 'Update invoice status failed',
  run: (input) => projectsService.setInvoiceStatus(input),
});
