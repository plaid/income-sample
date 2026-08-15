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
