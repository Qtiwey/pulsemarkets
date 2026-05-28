import clsx from "clsx";
import { useEffect, useState } from "react";

import { Modal } from "ui/modal/Modal";
import { Typography } from "ui/typography/Typography";
import { Grid } from "ui/grid/Grid";
import { Card } from "ui/card/Card";
import ipfs from "providers/ipfs";
import { Icon } from "ui/icon/Icon";
import { useEVMPromptWarsMarketContractContext } from "context/evm/prompt-wars-market-contract/useEVMPromptWarsMarketContractContext";
import {
  Player,
  zeroXaddress,
} from "context/evm/prompt-wars-market-contract/PromptWarsMarketContractContext.types";

import styles from "./ResultsModal.module.scss";
import { ResultsModalOutcomeToken, ResultsModalProps } from "./ResultsModal.types";

const emptyAddress: zeroXaddress = "0x0000000000000000000000000000000000000000";

const getPromptValues = (prompt: string) => {
  try {
    const parsed = JSON.parse(prompt) as { value?: string; negative_prompt?: string };

    return {
      prompt: parsed.value ?? prompt,
      negativePrompt: parsed.negative_prompt ?? "",
    };
  } catch {
    return {
      prompt,
      negativePrompt: "",
    };
  }
};

const toOutcomeToken = (player: Player): ResultsModalOutcomeToken => {
  const { prompt, negativePrompt } = getPromptValues(player.prompt);

  return {
    outcomeId: player.id,
    outputImgUrl: player.outputImgUri ? ipfs.asHttpsURL(player.outputImgUri) : "/shared/loading-spinner.gif",
    prompt,
    negativePrompt,
    result: player.result,
  };
};

export const ResultsModal: React.FC<ResultsModalProps> = ({ onClose, className, marketContractValues }) => {
  const [outcomeToken, setOutcomeToken] = useState<ResultsModalOutcomeToken | undefined>();
  const [winnerOutcomeToken, setWinnerOutcomeToken] = useState<ResultsModalOutcomeToken | undefined>();

  const contract = useEVMPromptWarsMarketContractContext();

  const { resolution, market, isResolved, currentPlayer } = marketContractValues;

  const getOutcomeToken = async (playerId: zeroXaddress) => {
    const player = await contract.getPlayer(playerId);

    if (!player) {
      return;
    }

    setOutcomeToken(toOutcomeToken(player));
  };

  const getWinnerOutcomeToken = async () => {
    const winnerId = resolution.playerId as zeroXaddress;

    if (!winnerId || winnerId === emptyAddress) {
      return;
    }

    const player = await contract.getPlayer(winnerId);

    if (!player) {
      return;
    }

    const token = toOutcomeToken(player);

    setWinnerOutcomeToken(token);
    setOutcomeToken(token);
  };

  const outcomeIds = [winnerOutcomeToken?.outcomeId, outcomeToken?.outcomeId, currentPlayer?.id].filter(
    (outcomeId, index, list): outcomeId is zeroXaddress => !!outcomeId && list.indexOf(outcomeId) === index,
  );

  useEffect(() => {
    if (isResolved) {
      getWinnerOutcomeToken();
      return;
    }

    if (currentPlayer?.id) {
      getOutcomeToken(currentPlayer.id);
    }
  }, [currentPlayer?.id, isResolved, resolution.playerId]);

  return (
    <Modal
      className={clsx(styles["results-modal"], className)}
      isOpened
      aria-labelledby="Prompt Wars Reveal Progress Modal Window"
      onClose={onClose}
      fullscreenVariant="default"
    >
      <Modal.Header onClose={onClose}>
        <Typography.Headline2 className={styles["results-modal__title"]} flat>
          Results <span>(closest to 0 wins)</span>
        </Typography.Headline2>
        <Typography.Text flat>
          Winner:{" "}
          <>
            {resolution?.playerId ? (
              <>
                {resolution?.playerId}, {winnerOutcomeToken?.result}
              </>
            ) : (
              "TBD"
            )}
          </>
        </Typography.Text>
      </Modal.Header>
      <Modal.Content>
        <Grid.Row>
          <Grid.Col lg={4} className={styles["results-modal__img-col"]}>
            <Card>
              <Card.Content className={styles["results-modal__img-col--content"]}>
                <img src={ipfs.asHttpsURL(market.imageUri)} alt="source" />
              </Card.Content>
            </Card>
          </Grid.Col>
          <Grid.Col lg={4} className={styles["results-modal__img-col"]}>
            <Card>
              <Card.Content className={styles["results-modal__img-col--content"]}>
                <div className={styles["results-modal__outcome-ids-list"]}>
                  {outcomeIds.map((outcomeId) => (
                    <div
                      key={outcomeId}
                      className={styles["results-modal__outcome-ids-list--item"]}
                      onClick={() => getOutcomeToken(outcomeId)}
                      onKeyPress={() => undefined}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles["results-modal__outcome-ids-list--item-left"]}>
                        <Typography.Description
                          flat
                          className={clsx({
                            [styles["results-modal__outcome-ids-list--item-winner"]]: outcomeId === resolution.playerId,
                          })}
                        >
                          {outcomeId === resolution.playerId && <Icon name="icon-medal-first" />} {outcomeId}
                        </Typography.Description>
                      </div>
                      <div className={styles["results-modal__outcome-ids-list--item-right"]}>
                        <Icon name="icon-chevron-right" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          </Grid.Col>
          <Grid.Col lg={4} className={styles["results-modal__img-col"]}>
            <Card>
              <Card.Content className={styles["results-modal__img-col--content"]}>
                <img src={outcomeToken?.outputImgUrl || "/shared/loading-spinner.gif"} alt="output" />
              </Card.Content>
            </Card>
          </Grid.Col>
        </Grid.Row>
      </Modal.Content>
      <Modal.Actions className={styles["results-modal__modal-actions"]}>
        <Grid.Row className={styles["results-modal__modal-actions--row"]}>
          <Grid.Col lg={3}>
            <Typography.Description>Account</Typography.Description>
            <Typography.Text className={styles["results-modal__modal-actions--text"]}>
              {outcomeToken?.outcomeId || "Loading"}
            </Typography.Text>
          </Grid.Col>
          <Grid.Col lg={3}>
            <Typography.Description>Prompt</Typography.Description>
            <Typography.Text className={styles["results-modal__modal-actions--text"]}>
              {outcomeToken?.prompt || "Loading"}
            </Typography.Text>
          </Grid.Col>
          <Grid.Col lg={3}>
            <Typography.Description>Negative Prompt</Typography.Description>
            <Typography.Text className={styles["results-modal__modal-actions--text"]}>
              {outcomeToken?.negativePrompt || "n/a"}
            </Typography.Text>
          </Grid.Col>
          <Grid.Col lg={3}>
            <Typography.Description>Result (closest to 0 wins)</Typography.Description>
            <Typography.Headline2 flat>{outcomeToken?.result || "Loading"}</Typography.Headline2>
          </Grid.Col>
        </Grid.Row>
      </Modal.Actions>
    </Modal>
  );
};
