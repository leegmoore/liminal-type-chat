import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Flex, 
  FormControl, 
  Select, 
  Stack, 
  Text, 
  Textarea, 
  useToast,
  VStack,
  HStack,
  IconButton,
  Spinner,
  Divider,
  Badge,
  Card,
  CardBody
} from '@chakra-ui/react';
import { AddIcon, SettingsIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { getAuthToken, loginAsGuest, initializeAuth } from '../services/authService';

// Types for LLM integration
interface LlmModel {
  id: string;
  provider: string;
  name: string;
  maxTokens: number;
  supportsStreaming: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    modelId?: string;
    provider?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    finishReason?: string;
  };
}

interface ConversationThread {
  conversationId: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Simple chat page for testing LLM integration
 */
const ChatPage: React.FC = () => {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [models, setModels] = useState<LlmModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Helper function to format date strings for display
  const formatDisplayDate = (dateString?: string): string => {
    if (!dateString) {
      return '';
    }
    try {
      const dateObj = new Date(dateString);
      // Check if date is valid after parsing
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date'; // Or return empty string, or the original string
      }
      return dateObj.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString; // Fallback to original string if error occurs
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize authentication on load
  useEffect(() => {
    const initAuth = async () => {
      // Check if we have a token
      const hasToken = initializeAuth();
      
      // If not, login as guest for development/testing
      if (!hasToken) {
        try {
          await loginAsGuest();
          toast({
            title: 'Logged in as guest',
            description: 'Using guest mode for testing',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error logging in as guest:', error);
          toast({
            title: 'Login failed',
            description: 'Failed to create guest session',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    };
    
    initAuth();
  }, [toast]);

  // Load threads on initial render
  useEffect(() => {
    const fetchThreads = async () => {
      // Ensure we have authentication before fetching
      if (!getAuthToken()) {
        console.warn('No authentication token available');
        return;
      }
      
      try {
        const response = await axios.get('/api/v1/conversations');
        if (response.data && response.data.conversations) {
          const fetchedThreads: ConversationThread[] = response.data.conversations.map((conv: any) => ({
            conversationId: conv.conversationId,
            title: conv.title,
            messages: conv.messages || [], 
            createdAt: conv.createdAt, 
            updatedAt: conv.updatedAt, 
            metadata: conv.metadata,   
          }));
          setThreads(fetchedThreads);
          
          // Select the first thread if one exists
          if (fetchedThreads.length > 0) {
            setSelectedThreadId(fetchedThreads[0].conversationId); 
            setMessages(fetchedThreads[0].messages || []);
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching threads:', error.message);
        } else {
          console.error('Error fetching threads:', error);
        }
        toast({
          title: 'Error fetching conversations',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchThreads();
  }, [toast]);

  // Load models when provider changes
  useEffect(() => {
    const fetchModels = async () => {
      try {
        // First check if we have an API key for this provider
        const apiKeyResponse = await axios.get(`/api/v1/api-keys/${provider}`);
        
        if (apiKeyResponse.data.hasKey) {
          // If we have an API key, fetch the models
          const response = await axios.get(`/api/v1/chat/models/${provider}`);
          if (response.data && response.data.models) {
            setModels(response.data.models);
            // Set default model (prefer Claude 3.7 Sonnet if available)
            if (response.data.models.length > 0) {
              const claude37 = response.data.models.find(
                (m: LlmModel) => m.id === 'claude-3-7-sonnet-20250218'
              );
              setSelectedModel(claude37?.id || response.data.models[0].id);
            }
          }
        } else {
          // No API key found
          setModels([]);
          toast({
            title: `No ${provider} API key found`,
            description: `Please add your ${provider} API key to use this provider.`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching models:', error.message);
        } else {
          console.error('Error fetching models:', error);
        }
        setModels([]);
      }
    };

    fetchModels();
  }, [provider, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create a new thread
  const createNewThread = async () => {
    try {
      const response = await axios.post('/api/v1/conversations', {
        title: `New Conversation ${threads.length + 1}` 
      });
      if (response.data) {
        // response.data is a ConversationResponse from backend
        const newThreadData = response.data;
        const newThread: ConversationThread = {
          conversationId: newThreadData.conversationId,
          title: newThreadData.title,
          messages: newThreadData.messages || [], 
          createdAt: newThreadData.createdAt, 
          updatedAt: newThreadData.updatedAt, 
          metadata: newThreadData.metadata,   
        };
        setThreads([...threads, newThread]);
        setSelectedThreadId(newThread.conversationId); 
        setMessages(newThread.messages || []);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error creating thread:', error.message);
      } else {
        console.error('Error creating thread:', error);
      }
      toast({
        title: 'Error creating conversation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Select a thread
  const selectThread = (threadId: string) => { 
    const thread = threads.find(t => t.conversationId === threadId); 
    if (thread) {
      setSelectedThreadId(thread.conversationId); 
      setMessages(thread.messages || []);
    }
  };

  // Save API key
  const saveApiKey = async (apiKeyToSave: string) => {
    if (!apiKeyToSave) return;
    
    try {
      // Make API call to store the API key
      const response = await axios.post(`/api/v1/api-keys/${provider}`, {
        apiKey: apiKeyToSave, 
        label: `${provider} API key`
      });
      
      if (response.status === 201) {
        toast({
          title: 'API key saved',
          description: `Your ${provider} API key has been securely stored.`,
          status: 'success',
          duration: 3000,
        });
        
        // Refresh models list after saving the API key
        const modelsResponse = await axios.get(`/api/v1/chat/models/${provider}`);
        if (modelsResponse.data && modelsResponse.data.models) {
          setModels(modelsResponse.data.models);
          if (modelsResponse.data.models.length > 0) {
            setSelectedModel(modelsResponse.data.models[0].id);
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error saving API key:', error.message);
      } else {
        console.error('Error saving API key:', error);
      }
      
      // Safe access for axios error response
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error saving API key',
        description: axiosError.response?.data?.message || 'Failed to save API key. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Send a prompt
  const sendPrompt = async () => {
    if (!prompt.trim() || !selectedThreadId) return;
    
    // Add user message to the UI immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };
    
    // Add placeholder for assistant response with streaming indicator
    const placeholderMessage: ChatMessage = {
      id: `placeholder-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      metadata: {
        provider,
        modelId: selectedModel
      }
    };
    
    setMessages([...messages, userMessage, placeholderMessage]);
    setLoading(true);
    
    // Save prompt to local state for resetting form
    const promptText = prompt;
    setPrompt('');
    
    try {
      if (models.find(m => m.id === selectedModel)?.supportsStreaming) {
        // Use streaming for better UX with Claude models
        const baseUrl = import.meta.env.DEV
          ? 'http://localhost:8765'
          : ''; // For production, relative path should work
        
        const eventSourceUrl = `${baseUrl}/api/v1/chat/completions/stream?threadId=${selectedThreadId}` +
          `&provider=${provider}&modelId=${selectedModel}&prompt=${encodeURIComponent(promptText)}`;
        
        console.log('Attempting to connect EventSource to:', eventSourceUrl); // Added for debugging

        const eventSource = new EventSource(eventSourceUrl);
        
        let responseContent = '';
        let messageId = placeholderMessage.id;
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Update response content
            responseContent += data.content;
            
            // If this is the first chunk, save the actual message ID
            if (messageId === placeholderMessage.id && data.messageId) {
              messageId = data.messageId;
            }
            
            // Update the message in UI
            setMessages(prevMessages => {
              const updatedMessages = [...prevMessages];
              const assistantMessageIndex = updatedMessages.findIndex(
                msg => msg.id === placeholderMessage.id
              );
              
              if (assistantMessageIndex !== -1) {
                updatedMessages[assistantMessageIndex] = {
                  ...updatedMessages[assistantMessageIndex],
                  id: messageId || placeholderMessage.id,
                  content: responseContent,
                  metadata: {
                    provider,
                    modelId: selectedModel,
                    usage: data.usage,
                    finishReason: data.finishReason
                  }
                };
              }
              
              return updatedMessages;
            });
            
            // Check if streaming is complete
            if (data.done) {
              eventSource.close();
              setLoading(false);
            }
          } catch (error) {
            console.error('Error parsing event data:', error);
            eventSource.close();
            setLoading(false);
          }
        };
        
        eventSource.onerror = (error) => {
          console.error('EventSource error:', error);
          eventSource.close();
          setLoading(false);
          
          toast({
            title: 'Error streaming response',
            description: 'There was an error receiving the streaming response.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        };
      } else {
        // Fallback to non-streaming for models that don't support it
        const response = await axios.post('/api/v1/chat/completions', {
          prompt: promptText,
          provider,
          modelId: selectedModel,
          threadId: selectedThreadId,
        });
        
        if (response.data) {
          // Fetch updated thread to get all messages
          const threadResponse = await axios.get(`/api/v1/conversations/${selectedThreadId}`);
          if (threadResponse.data) {
            setMessages(threadResponse.data.messages || []);
          }
        }
        
        setLoading(false);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error sending prompt:', error.message);
      } else {
        console.error('Error sending prompt:', error);
      }
      // Safe access for axios error response
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error sending prompt',
        description: axiosError.response?.data?.message || 'Failed to send prompt. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Flex h="calc(100vh - 200px)" direction="row" borderWidth={1} borderRadius="lg" 
        overflow="hidden">
        {/* Sidebar */}
        <Box w="250px" borderRightWidth={1} p={3} overflowY="auto">
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontWeight="bold">Conversations</Text>
              <IconButton
                size="sm"
                icon={<AddIcon />}
                aria-label="New conversation"
                onClick={createNewThread}
              />
            </HStack>
            
            <Divider />
            
            {threads.length === 0 ? (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                No conversations yet
              </Text>
            ) : (
              threads.map(thread => (
                <Card 
                  key={thread.conversationId} 
                  onClick={() => selectThread(thread.conversationId)} 
                  cursor="pointer"
                  mb={2}
                  bg={selectedThreadId === thread.conversationId ? 'teal.100' : 'gray.50'} 
                  _hover={{ bg: selectedThreadId === thread.conversationId ? 'teal.200' : 'gray.100' }} 
                  variant="outline"
                  size="sm"
                >
                  <CardBody p={2}>
                    <Text 
                      fontWeight={selectedThreadId === thread.conversationId ? 'bold' : 'normal'} 
                      isTruncated
                    >
                      {thread.title || `Conversation ${thread.conversationId.substring(0, 8)}...`}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {/* Display formatted updatedAt or createdAt if available */}
                      {thread.updatedAt ? `Updated: ${formatDisplayDate(thread.updatedAt)}` : (thread.createdAt ? `Created: ${formatDisplayDate(thread.createdAt)}` : '')}
                    </Text>
                  </CardBody>
                </Card>
              ))
            )}
          </VStack>
        </Box>
        
        {/* Main chat area */}
        <Box flex="1" display="flex" flexDirection="column">
          {selectedThreadId ? (
            <>
              {/* Messages area */}
              <Box flex="1" p={4} overflowY="auto" bg="gray.50">
                {messages.length === 0 ? (
                  <Flex justify="center" align="center" h="100%">
                    <Text color="gray.400">
                      No messages yet. Start a conversation!
                    </Text>
                  </Flex>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {messages.map(message => (
                      <Box
                        key={message.id}
                        alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                        maxW="80%"
                      >
                        <Card 
                          bg={message.role === 'user' ? 'blue.50' : 
                            (message.role === 'assistant' && 
                            (provider === 'anthropic' || message.metadata?.provider === 'anthropic'))
                              ? (message.metadata?.modelId?.includes('claude-3-7') 
                                ? 'purple.50' : 'purple.25')
                              : 'white'} 
                          borderRadius="lg"
                          shadow="sm"
                          borderLeft={
                            message.role === 'assistant' && 
                            (provider === 'anthropic' || message.metadata?.provider === 'anthropic')
                              ? '3px solid' : 'none'
                          }
                          borderColor={
                            message.metadata?.modelId?.includes('claude-3-7') 
                              ? 'purple.500' : 'purple.300'
                          }
                        >
                          <CardBody p={3}>
                            <Flex justifyContent="space-between" alignItems="center" mb={1}>
                              <Badge colorScheme={
                                message.role === 'user' ? 'blue' : 
                                  (message.role === 'assistant' && 
                                  (provider === 'anthropic' || message.metadata?.provider === 'anthropic'))
                                    ? 'purple' : 'green'
                              }>
                                {message.role === 'assistant' && 
                                 (provider === 'anthropic' || message.metadata?.provider === 'anthropic')
                                  ? 'Claude' : message.role}
                              </Badge>
                              
                              {message.role === 'assistant' && message.metadata?.modelId?.includes('claude-3-7') && (
                                <Badge colorScheme="purple" variant="outline" ml={1} fontSize="2xs">
                                  Claude 3.7 Sonnet
                                </Badge>
                              )}
                            </Flex>
                            {message.content ? (
                              <Text whiteSpace="pre-wrap">{message.content}</Text>
                            ) : (
                              <Flex align="center" justify="center" py={2}>
                                <Spinner size="sm" color="purple.500" mr={2} />
                                <Text color="gray.500" fontSize="sm">Claude is thinking...</Text>
                              </Flex>
                            )}
                            
                            {message.role === 'assistant' && (
                              <Flex justify="space-between" align="center" mt={2}>
                                {message.metadata?.provider === 'anthropic' && 
                                 message.metadata?.modelId?.includes('claude-3-7') && (
                                  <Text fontSize="2xs" color="purple.600">
                                    Powered by Claude 3.7 Sonnet
                                  </Text>
                                )}
                                
                                {message.metadata?.usage && (
                                  <Text fontSize="xs" color="gray.500" textAlign="right">
                                    {(message.metadata.usage.totalTokens || 0).toLocaleString()} 
                                    tokens
                                  </Text>
                                )}
                              </Flex>
                            )}
                          </CardBody>
                        </Card>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </VStack>
                )}
              </Box>
              
              {/* Input area */}
              <Box p={3} borderTopWidth={1}>
                <Stack spacing={3}>
                  <VStack spacing={2} align="stretch">
                    <HStack>
                      <FormControl>
                        <Select 
                          size="sm"
                          value={provider} 
                          onChange={e => setProvider(e.target.value as 'openai' | 'anthropic')}
                          colorScheme={provider === 'anthropic' ? 'purple' : 'green'}
                        >
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic Claude</option>
                        </Select>
                      </FormControl>
                      
                      <FormControl>
                        <Select 
                          size="sm"
                          value={selectedModel} 
                          onChange={e => setSelectedModel(e.target.value)}
                          placeholder="Select model"
                          isDisabled={models.length === 0}
                        >
                          {models.length === 0 ? (
                            <option disabled>No models available</option>
                          ) : (
                            models.map((model: LlmModel) => (
                              <option
                                key={model.id}
                                value={model.id}
                                style={{
                                  fontWeight: model.id === 'claude-3-7-sonnet-20250218'
                                    ? 'bold' : 'normal'
                                }}
                              >
                                {model.name}
                                {model.id === 'claude-3-7-sonnet-20250218' ? ' (Recommended)' : ''}
                              </option>
                            ))
                          )}
                        </Select>
                      </FormControl>
                      
                      <IconButton
                        size="sm"
                        aria-label="Settings"
                        icon={<SettingsIcon />}
                        colorScheme={models.length > 0 ? 'green' : 'red'}
                        title={models.length > 0 ? 'API key configured' : 'API key needed'}
                        onClick={() => {
                          const userAPIKey = window.prompt( 
                            `Enter your ${provider === 'anthropic' ? 'Anthropic Claude' 
                              : 'OpenAI'} API key`
                          );
                          if (userAPIKey) {
                            saveApiKey(userAPIKey);
                          }
                        }}
                      />
                    </HStack>
                    
                    {provider === 'anthropic' && selectedModel === 'claude-3-7-sonnet-20250218' && (
                      <Box 
                        p={2} 
                        bg="purple.50" 
                        borderRadius="md" 
                        fontSize="xs"
                        borderLeft="3px solid" 
                        borderColor="purple.400"
                      >
                        <Text fontWeight="bold">Using Claude 3.7 Sonnet</Text>
                        <Text>
                          Claude 3.7 Sonnet offers a 200K token context window and improved 
                          reasoning capabilities. Perfect for complex conversations.
                        </Text>
                      </Box>
                    )}
                  </VStack>
                  
                  <Flex>
                    <Textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Type your message here..."
                      resize="none"
                      rows={3}
                      mr={2}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendPrompt();
                        }
                      }}
                    />
                    <Button
                      colorScheme="blue"
                      onClick={sendPrompt}
                      alignSelf="flex-end"
                      isLoading={loading}
                      loadingText="Sending"
                      disabled={!prompt.trim() || loading}
                    >
                      Send
                    </Button>
                  </Flex>
                </Stack>
              </Box>
            </>
          ) : (
            <Flex justify="center" align="center" h="100%">
              <Box textAlign="center">
                <Text mb={4}>No conversation selected</Text>
                <Button colorScheme="blue" onClick={createNewThread}>
                  Create New Conversation
                </Button>
              </Box>
            </Flex>
          )}
        </Box>
      </Flex>
    </Container>
  );
};

export default ChatPage;