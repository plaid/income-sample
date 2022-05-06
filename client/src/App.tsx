import { useState } from "react";
import { ChakraProvider, Text } from "@chakra-ui/react";
import { Container, Flex, Heading } from "@chakra-ui/layout";
import { UserContext, PlaidConnectStatus } from "./components/UserContext";
import UserStatus from "./components/UserStatus";

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
        gap="2"
      >
        <Heading>Todd's Pre-owned hoverboards!</Heading>
        <Text fontSize="sm">
          If they set your house on fire, your next hoverboard is half off!
        </Text>
        <Flex
          background="gray.100"
          p={4}
          mt={6}
          rounded={8}
          direction="column"
          alignItems="center"
          width="80vw"
        >
          <Heading>Financing</Heading>

          <Text fontSize="md">
            Find out if you qualify for financing for a pre-owned hoverboard!
          </Text>
          <UserContext.Provider value={{ user, setUser }}>
            <UserStatus />
          </UserContext.Provider>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
}

export default App;
