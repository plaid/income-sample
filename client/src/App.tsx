import { useState } from "react";
import { ChakraProvider, Text } from "@chakra-ui/react";
import { Box, Flex, Heading, VStack } from "@chakra-ui/layout";
import { UserContext, PlaidConnectStatus } from "./components/UserContext";
import UserStatus from "./components/UserStatus";
import DebugPanel from "./components/DebugPanel";

function App() {
  const [user, setUser] = useState({
    userName: "Default User",
    incomeConnected: PlaidConnectStatus.Unknown,
    incomeUpdateTime: Date.now(),
    liabilitiesConnected: PlaidConnectStatus.Unknown,
  });

  return (
    <ChakraProvider>
      <Flex
        height="100vh"
        alignItems="center"
        justifyContent="center"
        direction="column"
      >
        <Heading>Todd's Pre-owned hoverboards!</Heading>
        <Text fontSize="sm">
          If they set your house on fire, your next hoverboard is half off!
        </Text>
        <VStack
          background="gray.100"
          p={4}
          mt={6}
          rounded={8}
          spacing={6}
          width="80vw"
        >
          <VStack spacing={2}>
            <Heading>Financing</Heading>
            <Text fontSize="md">
              Find out if you qualify for financing for a pre-owned hoverboard!
            </Text>
          </VStack>
          <UserContext.Provider value={{ user, setUser }}>
            <UserStatus />
          </UserContext.Provider>
        </VStack>

        <Box width="80vw" position="fixed" bottom="0px">
          <DebugPanel />
        </Box>
      </Flex>
    </ChakraProvider>
  );
}

export default App;
