import { normalizeThreadMessages } from '../normalizeThreadMessages';
import { Message, MessageRole } from '../../types/domain';

describe('normalizeThreadMessages', () => {
  it('should return an empty array when messages is null', () => {
    // @ts-ignore - Testing null case
    const result = normalizeThreadMessages(null);
    expect(result).toEqual([]);
  });

  it('should return an empty array when messages is empty', () => {
    const result = normalizeThreadMessages([]);
    expect(result).toEqual([]);
  });

  it('should sort messages by createdAt in ascending order', () => {
    // Arrange
    const messages: Message[] = [
      {
        id: '3',
        threadId: 'thread-1',
        content: 'Third message',
        role: 'user' as MessageRole,
        createdAt: 300,
      },
      {
        id: '1',
        threadId: 'thread-1',
        content: 'First message',
        role: 'user' as MessageRole,
        createdAt: 100,
      },
      {
        id: '2',
        threadId: 'thread-1',
        content: 'Second message',
        role: 'assistant' as MessageRole,
        createdAt: 200,
      },
    ];

    // Act
    const result = normalizeThreadMessages(messages);

    // Assert
    expect(result).toEqual([
      {
        id: '1',
        threadId: 'thread-1',
        content: 'First message',
        role: 'user',
        createdAt: 100,
      },
      {
        id: '2',
        threadId: 'thread-1',
        content: 'Second message',
        role: 'assistant',
        createdAt: 200,
      },
      {
        id: '3',
        threadId: 'thread-1',
        content: 'Third message',
        role: 'user',
        createdAt: 300,
      },
    ]);
  });

  it('should return a new array and not modify the original', () => {
    // Arrange
    const messages: Message[] = [
      {
        id: '2',
        threadId: 'thread-1',
        content: 'Second message',
        role: 'assistant' as MessageRole,
        createdAt: 200,
      },
      {
        id: '1',
        threadId: 'thread-1',
        content: 'First message',
        role: 'user' as MessageRole,
        createdAt: 100,
      },
    ];
    
    const originalMessages = [...messages];

    // Act
    const result = normalizeThreadMessages(messages);

    // Assert
    expect(result).not.toBe(messages); // Check that it's a new array
    expect(messages).toEqual(originalMessages); // Original array wasn't modified
  });
});
