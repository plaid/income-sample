import {
  Accordion,
  AccordionItem,
  AccordionButton,
  Box,
  AccordionPanel,
  AccordionIcon,
  Button,
} from "@chakra-ui/react";

const DebugPanel = () => {
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

  return (
    <Accordion allowToggle width="100%">
      <AccordionItem>
        <AccordionPanel pb={4}>
          <Button
            colorScheme="green"
            onClick={() => performPrecheck("HIGH")}
            mr={4}
          >
            Simulate a good pre-check
          </Button>
          <Button
            colorScheme="green"
            onClick={() => performPrecheck("UNKNOWN")}
          >
            Reset our pre-check
          </Button>
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
