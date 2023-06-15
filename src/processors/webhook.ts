import { Web3Event } from '@/types/events';

import log from '@/services/log';
import axios from 'axios';
import {
  ContractCastEventProcessor,
  ConfigurationTemplate,
  EventProcessorCtx,
} from '@/types/processor';

export class WebHookEventProcessor implements ContractCastEventProcessor {
  PROCESSOR_NAME = 'webhook';

  name(): string {
    return this.PROCESSOR_NAME;
  }
  getConfTemplate(): ConfigurationTemplate {
    return {
      url: {
        type: 'string',
        required: true,
      },
      authorizationKey: {
        type: 'string',
        required: false,
      },
    };
  }

  async onEvent<N, T>(ctx: EventProcessorCtx, event: Web3Event<N, T>): Promise<void> {
    log.d(
      `[${this.PROCESSOR_NAME}] Event Received from ${event.event} ` +
        ` on cast ${ctx.cast.id} address ${ctx.cast.address}`
    );

    const url = (ctx.curStep?.configuration?.url.value as string) ?? null;

    if (url) {
      log.d(`[${this.PROCESSOR_NAME}] Calling webhook for ${url} for ${event.event}`);
      const response = await axios.post(url, {
        event,
        metadata: {
          id: ctx.cast.id,
          address: ctx.cast.address,
          chainId: ctx.cast.chainId,
        },
      });
      if (response.status == 200) {
        log.d(`[${this.PROCESSOR_NAME}] Weekhook called succesfully`);
      } else {
        log.w(
          `[${this.PROCESSOR_NAME}] Weekhook failed to be called ` +
            `${response.status} ${response.statusText} on url `,
          url
        );
      }
    }
  }
}
