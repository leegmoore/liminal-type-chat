import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Link,
  HStack,
  Container,
  useColorModeValue,
} from '@chakra-ui/react';

/**
 * Application header component with navigation
 */
const Header: React.FC = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box as="header" bg={bgColor} borderBottom="1px" borderColor={borderColor} py={4}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <Heading as="h1" size="md" fontWeight="bold" color="brand.500">
            <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
              Liminal Type Chat
            </Link>
          </Heading>
          <HStack spacing={6}>
            <Link as={RouterLink} to="/" fontWeight="medium">
              Health Dashboard
            </Link>
            <Link as={RouterLink} to="/chat" fontWeight="medium">
              Chat
            </Link>
            <Link as={RouterLink} to="/auth-tester" fontWeight="medium">
              Auth Tester
            </Link>
            <Link href="http://localhost:8765/docs/edge" fontWeight="medium" target="_blank">
              API Docs
            </Link>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Header;
