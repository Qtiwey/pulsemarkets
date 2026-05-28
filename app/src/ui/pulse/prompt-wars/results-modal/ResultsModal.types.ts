import { ReactNode } from "react";

import {
  PromptWarsMarketContractValues,
  zeroXaddress,
} from "context/evm/prompt-wars-market-contract/PromptWarsMarketContractContext.types";

export type ResultsModalProps = {
  onClose: () => void;
  marketContractValues: PromptWarsMarketContractValues;
  children?: ReactNode;
  className?: string;
};

export type ResultsModalOutcomeToken = {
  outcomeId: zeroXaddress;
  outputImgUrl: string;
  prompt: string;
  negativePrompt: string;
  result: string;
};
