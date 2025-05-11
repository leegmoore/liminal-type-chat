import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Divider,
  useToast,
} from '@chakra-ui/react';
import HealthCheckCard from '../components/HealthCheckCard';
import { checkServerHealth, checkDatabaseHealth } from '../services/healthService';
import { HealthStatus, DatabaseHealthStatus } from '../types/health';

/**
 * Health Dashboard page component
 * Displays health check cards for both domain and edge tiers
 */
const HealthDashboard: React.FC = () => {
  const toast = useToast();

  // Domain tier health states
  const [domainServerHealth, setDomainServerHealth] = useState<{
    data: HealthStatus | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const [domainDbHealth, setDomainDbHealth] = useState<{
    data: DatabaseHealthStatus | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  // Edge tier health states
  const [edgeServerHealth, setEdgeServerHealth] = useState<{
    data: HealthStatus | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const [edgeDbHealth, setEdgeDbHealth] = useState<{
    data: DatabaseHealthStatus | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  // Handler for domain server health check
  const handleDomainServerHealthCheck = async () => {
    setDomainServerHealth({ data: null, loading: true, error: null });

    try {
      const data = await checkServerHealth('domain');
      setDomainServerHealth({ data, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setDomainServerHealth({ data: null, loading: false, error: message });
      toast({
        title: 'Health Check Failed',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handler for domain database health check
  const handleDomainDbHealthCheck = async () => {
    setDomainDbHealth({ data: null, loading: true, error: null });

    try {
      const data = await checkDatabaseHealth('domain');
      setDomainDbHealth({ data, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setDomainDbHealth({ data: null, loading: false, error: message });
      toast({
        title: 'Database Health Check Failed',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handler for edge server health check
  const handleEdgeServerHealthCheck = async () => {
    setEdgeServerHealth({ data: null, loading: true, error: null });

    try {
      const data = await checkServerHealth('edge');
      setEdgeServerHealth({ data, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setEdgeServerHealth({ data: null, loading: false, error: message });
      toast({
        title: 'Health Check Failed',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handler for edge database health check
  const handleEdgeDbHealthCheck = async () => {
    setEdgeDbHealth({ data: null, loading: true, error: null });

    try {
      const data = await checkDatabaseHealth('edge');
      setEdgeDbHealth({ data, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setEdgeDbHealth({ data: null, loading: false, error: message });
      toast({
        title: 'Database Health Check Failed',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl">
      <Box mb={8} textAlign="center">
        <Heading as="h1" size="xl" mb={3}>
          System Health Dashboard
        </Heading>
        <Text fontSize="lg" color="gray.600" maxW="800px" mx="auto">
          Monitor the health of different tiers of the Liminal Type Chat application.
          Test both domain and edge tier endpoints to ensure proper functionality.
        </Text>
      </Box>

      {/* Domain Tier Health Checks */}
      <Box mb={10}>
        <Heading as="h2" size="lg" mb={4}>
          Domain Tier Health
        </Heading>
        <Text fontSize="md" color="gray.600" mb={5}>
          The domain tier represents the core business logic of the application
          and direct database access.
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <HealthCheckCard
            title="Domain Server Health"
            subtitle="Checks the health of the domain tier server"
            checkType="server"
            tier="domain"
            result={domainServerHealth}
            onCheck={handleDomainServerHealthCheck}
          />

          <HealthCheckCard
            title="Domain Database Health"
            subtitle="Checks the connection to the database from the domain tier"
            checkType="database"
            tier="domain"
            result={domainDbHealth}
            onCheck={handleDomainDbHealthCheck}
          />
        </SimpleGrid>
      </Box>

      <Divider my={8} />

      {/* Edge Tier Health Checks */}
      <Box>
        <Heading as="h2" size="lg" mb={4}>
          Edge Tier Health
        </Heading>
        <Text fontSize="md" color="gray.600" mb={5}>
          The edge tier handles API routes and communicates with the domain tier
          using the client adapter pattern.
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <HealthCheckCard
            title="Edge Server Health"
            subtitle="Checks the health of the edge tier server"
            checkType="server"
            tier="edge"
            result={edgeServerHealth}
            onCheck={handleEdgeServerHealthCheck}
          />

          <HealthCheckCard
            title="Edge Database Health"
            subtitle="Checks the connection to the database through the edge tier"
            checkType="database"
            tier="edge"
            result={edgeDbHealth}
            onCheck={handleEdgeDbHealthCheck}
          />
        </SimpleGrid>
      </Box>
    </Container>
  );
};

export default HealthDashboard;
