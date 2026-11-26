import { z } from 'zod';
const difficulty = z.enum(['easy', 'medium', 'hard']);
const test = z.object({ id: z.string(), input: z.string(), expectedOutput: z.string() });
export const questionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mcq'), question: z.string(), options: z.array(z.string()).length(4), correct_index: z.number().int().min(0).max(3), category: z.string(), difficulty, marks: z.number().positive(), explanation: z.string() }),
  z.object({ type: z.literal('coding'), title: z.string(), description: z.string(), difficulty, languages: z.array(z.string()).min(1), time_limit: z.number().positive(), max_marks: z.number().positive(), public_test_cases: z.array(test).min(1), private_test_cases: z.array(test).min(1) }),
  z.object({ type: z.literal('writing'), title: z.string(), prompt: z.string(), min_words: z.number().int().nonnegative(), max_words: z.number().int().positive(), marks: z.number().positive() }),
  z.object({ type: z.literal('fib'), sentence: z.string(), answers: z.array(z.string()).min(1), case_sensitive: z.boolean(), marks: z.number().positive(), difficulty, explanation: z.string() }),
]);
export type DraftQuestion = z.infer<typeof questionSchema>;
export const draftSchema = z.object({ questions: z.array(questionSchema).min(1).max(20) });
export const emailSchema = z.object({ subject: z.string(), body: z.string() });

export const generateSchema = z.object({
  action: z.literal('generate'), topic: z.string().trim().min(1).max(500), difficulty,
  type: z.enum(['mcq', 'coding', 'fib', 'writing', 'test']),
  count: z.number().int().min(1).max(20).optional(),
  testName: z.string().trim().min(1).max(200).optional(),
  counts: z.object({ mcq: z.number().int().min(0).max(20), coding: z.number().int().min(0).max(20), fib: z.number().int().min(0).max(20), writing: z.number().int().min(0).max(20) }).optional(),
  avoid: z.array(z.string().max(300)).max(400).optional(),
}).superRefine((v, ctx) => {
  if (v.type === 'test' ? !v.testName || !v.counts || Object.values(v.counts).reduce((a,b) => a+b,0) < 1 : !v.count)
    ctx.addIssue({ code: 'custom', message: 'Provide a count, or test name and section counts.' });
});

export const emailRequestSchema = z.object({
  action: z.literal('email'),
  prompt: z.string().trim().min(1).max(2000),
  purpose: z.string().max(100).optional(),
  variables: z.string().max(1000).optional(),
  current: z.object({ subject: z.string().max(500), body: z.string().max(15000) }).optional(),
});
