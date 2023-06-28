import log from '@/services/log';
import { Instruction, VirtualMachine, InstructionArgs } from '@/types/vm';
import { z } from 'zod';
import { google } from 'googleapis';

const ArgsTypeSchema = z.object({
  inputBody: z.string().min(2),
  auth: z.string().min(2),
  spreadsheetId: z.string().min(2),
  range: z.string().min(2),
});
type ArgsType = z.infer<typeof ArgsTypeSchema>;

export class SpreadSheet implements Instruction {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateArgs(args: InstructionArgs | undefined): boolean {
    const res = ArgsTypeSchema.safeParse(args);
    if (!res.success) {
      log.d(`Failed to compile instruction set - ${res.error}`);
      return false;
    }
    return true;
  }

  INSTRUCTION_NAME = 'spreadsheet';

  name(): string {
    return this.INSTRUCTION_NAME;
  }
  getArgsSchema(): typeof ArgsTypeSchema {
    return ArgsTypeSchema;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onAction(vm: VirtualMachine): Promise<void> {
    const step = vm.getCurrentStackItem();

    const args: ArgsType = {
      inputBody: (step?.args?.inputBody as string) ?? '',
      auth: (step?.args?.auth as string) ?? '',
      spreadsheetId: (step?.args?.spreadsheetId as string) ?? '',
      range: (step?.args?.range as string) ?? '',
    };
    const authBody = Buffer.from(args.auth, 'base64').toString('ascii');
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(authBody),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const values = vm.getGlobalVariableFromPath(args.inputBody);
    try {
      // Create a new Google Sheets API client
      const sheets = google.sheets({ version: 'v4', auth });

      // Set the spreadsheet ID and range
      const spreadsheetId = args.spreadsheetId;
      const range = args.range; // Update with your desired range

      // Create the request body with the row data
      const request = {
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [values],
        },
      };

      // Send the update request to append the row
      const response = await sheets.spreadsheets.values.append(request);

      log.d('Row sent successfully:', response.status);
    } catch (error) {
      console.error('Error sending row:', error);
    }
  }
}
