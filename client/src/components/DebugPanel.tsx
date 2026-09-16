import {
  Accordion,
  Box,
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
    <Accordion.Root collapsible width="100%" defaultValue={[]}>
      <Accordion.Item value="debug">
        <Accordion.ItemContent pb={4}>
          <Flex gap={2}>
            <Input
              placeholder="https://webhookurlgoeshere.com/server/receive_webhook"
              onChange={(e) => setWebhookURL(e.target.value)}
              value={webhookURL}
            />
            <Spacer />
            <Button
              paddingX="2rem"
              colorPalette="yellow"
              onClick={() => updateWebhook()}
            >
              Update webhook
            </Button>
          </Flex>
        </Accordion.ItemContent>

        <h2>
          <Accordion.ItemTrigger>
            <Box flex="1" textAlign="left">
              Debug items
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
        </h2>
      </Accordion.Item>
    </Accordion.Root>
  );
};

export default DebugPanel;
