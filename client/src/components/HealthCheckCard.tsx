import React from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  Text,
  Spinner,
  Flex,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { HealthStatus, DatabaseHealthStatus } from '../types/health';

interface HealthCheckCardProps {
  title: string;
  subtitle: string;
  checkType: 'server' | 'database';
  tier: 'domain' | 'edge';
  result: {
    data: HealthStatus | DatabaseHealthStatus | null;
    loading: boolean;
    error: string | null;
  };
  onCheck: () => void;
}

/**
 * Card component for displaying health check status and controls
 */
const HealthCheckCard: React.FC<HealthCheckCardProps> = ({
  title,
  subtitle,
  checkType,
  tier,
  result,
  onCheck,
}) => {
  const { data, loading, error } = result;
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const dbDetailsBg = useColorModeValue('gray.50', 'gray.700');

  const isSuccess = data?.status === 'ok';

  // Format timestamp if available
  const formattedTime = data?.timestamp 
    ? new Date(data.timestamp).toLocaleString() 
    : null;

  return (
    <Card 
      bg={cardBg} 
      borderWidth="1px" 
      borderColor={borderColor} 
      borderRadius="lg" 
      boxShadow="md"
      height="100%"
      display="flex"
      flexDirection="column"
    >
      <CardHeader pb={2}>
        <Flex justifyContent="space-between" alignItems="center" mb={1}>
          <Heading size="md">{title}</Heading>
          <Badge 
            colorScheme={tier === 'domain' ? 'purple' : 'blue'} 
            fontSize="0.8em"
          >
            {tier.toUpperCase()}
          </Badge>
        </Flex>
        <Text fontSize="sm" color="gray.500">{subtitle}</Text>
      </CardHeader>

      <CardBody pt={0} flex="1">
        {loading ? (
          <Flex direction="column" align="center" justify="center" height="100%" py={6}>
            <Spinner 
              thickness="4px"
              speed="0.65s"
              data-testid="loading-spinner" 
              color="brand.500"
              size="xl"
              mb={4}
            />
            <Text>Checking {checkType} health...</Text>
          </Flex>
        ) : data ? (
          <Box>
            <Flex align="center" mb={3}>
              {isSuccess ? (
                <CheckCircleIcon color="green.500" boxSize="6" mr={2} />
              ) : (
                <WarningIcon data-testid="warning-icon" color="red.500" boxSize="6" mr={2} />
              )}
              <Text fontWeight="bold">
                Status: {isSuccess ? 'Healthy' : 'Error'}
              </Text>
            </Flex>
            
            {checkType === 'database' && 'database' in data && (
              <Box mt={3} p={3} bg={dbDetailsBg} borderRadius="md">
                <Text mb={1}>
                  <Text as="span" fontWeight="semibold">Database: </Text>
                  {(data as DatabaseHealthStatus).database.name}
                </Text>
                <Text mb={1}>
                  <Text as="span" fontWeight="semibold">Connected: </Text>
                  {(data as DatabaseHealthStatus).database.connected ? 'Yes' : 'No'}
                </Text>
                {(data as DatabaseHealthStatus).database.version && (
                  <Text>
                    <Text as="span" fontWeight="semibold">Version: </Text>
                    {(data as DatabaseHealthStatus).database.version}
                  </Text>
                )}
              </Box>
            )}
            
            {data.details && (
              <Text mt={3} fontStyle="italic">
                {data.details}
              </Text>
            )}
            
            {formattedTime && (
              <Text fontSize="sm" color="gray.500" mt={4}>
                Last checked: {formattedTime}
              </Text>
            )}
          </Box>
        ) : error ? (
          <Flex direction="column" align="center" color="red.500" py={4}>
            <WarningIcon boxSize="8" mb={2} />
            <Text align="center">{error}</Text>
          </Flex>
        ) : (
          <Flex direction="column" align="center" justify="center" height="100%" py={6}>
            <Text color="gray.500">No health check performed yet</Text>
          </Flex>
        )}
      </CardBody>

      <CardFooter pt={0}>
        <Button 
          colorScheme="brand" 
          onClick={onCheck} 
          isLoading={loading}
          loadingText="Checking..."
          width="100%"
        >
          Check {checkType === 'server' ? 'Server' : 'Database'} Health
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HealthCheckCard;
