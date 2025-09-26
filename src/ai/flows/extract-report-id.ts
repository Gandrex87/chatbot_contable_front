'use server';

/**
 * @fileOverview Extracts the ReportId from a chat response using a regex and returns it.
 *
 * @extractReportId - A function that extracts the report ID from a chat response.
 * @ExtractReportIdInput - The input type for the extractReportId function.
 * @ExtractReportIdOutput - The return type for the extractReportId function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractReportIdInputSchema = z.object({
  chatResponse: z.string().describe('The chat response string to extract the ReportId from.'),
});
export type ExtractReportIdInput = z.infer<typeof ExtractReportIdInputSchema>;

const ExtractReportIdOutputSchema = z.object({
  reportId: z.string().optional().describe('The extracted ReportId, if found.'),
});
export type ExtractReportIdOutput = z.infer<typeof ExtractReportIdOutputSchema>;

export async function extractReportId(input: ExtractReportIdInput): Promise<ExtractReportIdOutput> {
  return extractReportIdFlow(input);
}

const extractReportIdPrompt = ai.definePrompt({
  name: 'extractReportIdPrompt',
  input: {schema: ExtractReportIdInputSchema},
  output: {schema: ExtractReportIdOutputSchema},
  prompt: `Extract the ReportId from the following chat response. The ReportId is a number that follows the text "ReportId:".

Chat Response: {{{chatResponse}}}

If no ReportId is found, return an empty object.

Example:
Chat Response: Here is your report. ReportId: 12345
Output: { "reportId": "12345" }

Chat Response: Here is your report.
Output: { }
`,
});

const extractReportIdFlow = ai.defineFlow(
  {
    name: 'extractReportIdFlow',
    inputSchema: ExtractReportIdInputSchema,
    outputSchema: ExtractReportIdOutputSchema,
  },
  async input => {
    const {output} = await extractReportIdPrompt(input);
    return output!;
  }
);
