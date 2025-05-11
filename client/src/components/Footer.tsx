import React from 'react';
import {
  Box,
  Container,
  Text,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';

/**
 * Application footer component
 */
const Footer: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box as="footer" bg={bgColor} py={4} mt="auto">
      <Container maxW="container.xl">
        <Text fontSize="sm" color={textColor} textAlign="center">
          &copy; {new Date().getFullYear()} Liminal Type Chat | 
          <Link 
            href="https://github.com/yourusername/liminal-type-chat" 
            color="brand.500" 
            ml={1}
            isExternal
          >
            GitHub
          </Link>
        </Text>
      </Container>
    </Box>
  );
};

export default Footer;
