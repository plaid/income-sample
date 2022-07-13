import {
  Accordion,
  AccordionItem,
  AccordionButton,
  Box,
  AccordionPanel,
  AccordionIcon,
  Button,
  Input,
  Flex,
  Spacer,
} from "@chakra-ui/react";
import { useState } from "react";

const DebugPanel = () => {
  const [webhookURL, setWebhookURL] = useState("");

  const performPrecheck = async (targetConfidence: string) => {
    const precheckResponse = await fetch("/appServer/simulate_precheck", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ confidence: targetConfidence }),
    });
    const precheckData = await precheckResponse.json();
    console.log(
      `I got back this precheck data: ${JSON.stringify(precheckData)}`
    );
    if (precheckData.confidence === "HIGH") {
      console.log(
        "From now on, payroll income will default to using Zenefits."
      );
    } else if (precheckData.confidence === "UNKNOWN") {
      console.log("Payroll income will go back to an unknown state");
    }
  };

  const updateWebhook = async () => {
    const webhookResponse = await fetch("/server/update_webhook", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ newUrl: webhookURL }),
    });
    const webhookResponseData = await webhookResponse.json();
    console.log(
      `Response from updating webhook: ${JSON.stringify(webhookResponseData)}`
    );
  };

  return (
    <Accordion allowToggle width="100%">
      <AccordionItem>
        <AccordionPanel pb={4}>
          <Button
            colorScheme="teal"
            onClick={() => performPrecheck("HIGH")}
            mr={4}
          >
            Simulate a good pre-check
          </Button>
          <Button
            colorScheme="yellow"
            onClick={() => performPrecheck("UNKNOWN")}
          >
            Reset our pre-check
          </Button>
        </AccordionPanel>
        <AccordionPanel pb={4}>
          <Flex gap={2}>
            <Input
              placeholder="https://webhookurlgoeshere.com/server/receive_webhook"
              onChange={(e) => setWebhookURL(e.target.value)}
              value={webhookURL}
            />
            <Spacer />
            <Button
              paddingX="2rem"
              colorScheme="yellow"
              onClick={() => updateWebhook()}
            >
              Update webhook
            </Button>
          </Flex>
        </AccordionPanel>

        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              Debug items
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
      </AccordionItem>
    </Accordion>
  );
};

export default DebugPanel;
