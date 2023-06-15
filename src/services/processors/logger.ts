import { ChainCastEventProcessor, Web3Event } from "@/types/events";
import { ChainCastType } from "@prisma/client";
import log from '@/services/log';

export class LoggerChainCastEventProcessor implements ChainCastEventProcessor {
  name(): string {
    return 'Chain Cast Event Logger';
  }
  onEvent<N, T>(
    cast: { id: string; chainId: number; type: ChainCastType; address: string },
    event: Web3Event<N, T>
  ): void {
    log.d(`Event Received from ${event.event} on cast ${cast.id} address ${address}`);
  }
}